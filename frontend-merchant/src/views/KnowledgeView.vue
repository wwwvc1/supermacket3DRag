<script setup lang="ts">
/**
 * 知识库文档管理与 Embedding 引擎维护视图
 * - 上传文档 (PDF, Word, Markdown, 本地 OCR 图片) 自动分块向量化
 * - 查看已入库文档及其切片数 (chunkCount) 与状态
 * - 动态切换 Embedding 模型引擎 (local: JVM ONNX / online: 云端 OpenAI 兼容)
 */
import { onMounted, ref } from 'vue'
import { Document, Refresh, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import type { KnowledgeDocument } from '@/types/api'
import { type EmbeddingProvider, listDocuments, switchEmbedding, uploadDocument } from '@/api/rag'
import { formatDateTime, formatFileSize } from '@/utils/format'

const loading = ref(false)
const uploading = ref(false)
const documents = ref<KnowledgeDocument[]>([])
const currentEngine = ref<EmbeddingProvider>('local')
const switching = ref(false)

async function loadDocuments() {
  loading.value = true
  try {
    documents.value = await listDocuments()
  } catch (err: any) {
    ElMessage.error(err.message || '加载知识库文档列表失败')
  } finally {
    loading.value = false
  }
}

async function handleCustomUpload(options: UploadRequestOptions) {
  const file = options.file
  uploading.value = true
  try {
    const doc = await uploadDocument(file)
    ElMessage.success(`文档《${doc.fileName}》解析向量化成功，生成 ${doc.chunkCount} 个切片`)
    await loadDocuments()
  } catch (err: any) {
    ElMessage.error(err.message || '文档上传解析失败')
  } finally {
    uploading.value = false
  }
}

async function handleSwitchEngine(provider: EmbeddingProvider) {
  switching.value = true
  try {
    const msg = await switchEmbedding(provider)
    ElMessage.success(msg || `Embedding 引擎已切换为: ${provider}`)
  } catch (err: any) {
    ElMessage.error(err.message || '切换 Embedding 引擎失败')
    // 恢复
    currentEngine.value = provider === 'local' ? 'online' : 'local'
  } finally {
    switching.value = false
  }
}

onMounted(() => {
  loadDocuments()
})
</script>

<template>
  <div class="space-y-4">
    <!-- 顶部状态与引擎切换 -->
    <div class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
      <div class="flex items-center gap-3">
        <span class="text-base font-medium text-gray-800">Embedding 向量模型引擎：</span>
        <el-radio-group
          v-model="currentEngine"
          :disabled="switching"
          @change="(val: any) => handleSwitchEngine(val)"
        >
          <el-radio-button label="local">本地 ONNX (BGE-Small-ZH)</el-radio-button>
          <el-radio-button label="online">云端 OpenAI 兼容 (text-embedding-3)</el-radio-button>
        </el-radio-group>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadDocuments">刷新列表</el-button>
    </div>

    <!-- 上传区域 -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <div class="text-sm font-medium text-gray-700 mb-3">上传新知识文档 / 规则手册</div>
      <el-upload
        drag
        action=""
        :http-request="handleCustomUpload"
        :show-file-list="false"
        :disabled="uploading"
        accept=".pdf,.docx,.md,.png,.jpg,.jpeg"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          拖拽文档到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip text-gray-400">
            支持 PDF (.pdf)、Word (.docx)、Markdown (.md) 以及图片 OCR (.png, .jpg, .jpeg) 纯本地切片入库
          </div>
        </template>
      </el-upload>
    </div>

    <!-- 文档表格 -->
    <div class="bg-white p-4 rounded-lg shadow-sm">
      <div class="flex justify-between items-center mb-3">
        <span class="text-sm font-medium text-gray-700">已入库知识库文档 (共 {{ documents.length }} 份)</span>
      </div>
      <el-table v-loading="loading" :data="documents" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="fileName" label="文档名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-icon class="text-blue-500"><Document /></el-icon>
              <span class="font-medium text-gray-800">{{ row.fileName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.fileType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="大小" width="110" align="right">
          <template #default="{ row }">
            <span class="font-mono text-gray-600">{{ formatFileSize(row.fileSize) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="chunkCount" label="向量切片数" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.chunkCount }} 块</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'" size="small">
              {{ row.status === 'SUCCESS' ? '解析成功' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="入库时间" width="180" align="center">
          <template #default="{ row }">
            <span class="text-xs text-gray-500">{{ formatDateTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
