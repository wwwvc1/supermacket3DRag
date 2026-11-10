<script setup lang="ts">
/**
 * 货架空间点位管理视图
 * - 货架列表展示：编码、名称、分区、3D 世界坐标 (X/Y/Z)、朝向 (rotationY)、相机特写注视点、状态
 * - 结合右侧 Canvas 俯视小地图实时展示
 * - 支持新增与编辑货架（保存后调用 POST /api/merchant/shelves）
 */
import { onMounted, ref } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Shelf } from '@/types/api'
import { listShelves } from '@/api/merchant'
import { radToDeg } from '@/utils/format'
import ShelfFormDialog from '@/components/shelf/ShelfFormDialog.vue'
import ShelfMiniMap from '@/components/shelf/ShelfMiniMap.vue'

const loading = ref(false)
const shelves = ref<Shelf[]>([])
const dialogVisible = ref(false)
const currentShelf = ref<Shelf | null>(null)
const selectedShelfForMap = ref<Shelf | null>(null)

async function loadShelves() {
  loading.value = true
  try {
    shelves.value = await listShelves()
  } catch (err: any) {
    ElMessage.error(err.message || '加载货架失败')
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  currentShelf.value = null
  dialogVisible.value = true
}

function handleEdit(shelf: Shelf) {
  currentShelf.value = { ...shelf }
  dialogVisible.value = true
}

function handleRowClick(row: Shelf) {
  selectedShelfForMap.value = row
}

function onSaved() {
  loadShelves()
}

onMounted(() => {
  loadShelves()
})
</script>

<template>
  <div class="space-y-4">
    <!-- 顶部操作栏 -->
    <div class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
      <div class="text-base font-medium text-gray-800">
        3D 空间货架点位维护 (当前共 {{ shelves.length }} 个货架)
      </div>
      <div class="flex items-center gap-3">
        <el-button :icon="Refresh" :loading="loading" @click="loadShelves">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增货架</el-button>
      </div>
    </div>

    <!-- 主体区域：左侧表格 + 右侧俯视图 -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2 bg-white p-4 rounded-lg shadow-sm">
        <el-table
          v-loading="loading"
          :data="shelves"
          stripe
          border
          highlight-current-row
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <el-table-column prop="shelfCode" label="编码" width="90" align="center">
            <template #default="{ row }">
              <span class="font-mono font-bold text-blue-600">{{ row.shelfCode }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="货架名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="zone" label="分区" width="110" />
          <el-table-column label="3D 世界坐标 (X, Y, Z)" min-width="160" align="center">
            <template #default="{ row }">
              <span class="font-mono text-xs text-gray-600">
                ({{ Number(row.positionX).toFixed(1) }}, {{ Number(row.positionY).toFixed(1) }}, {{ Number(row.positionZ).toFixed(1) }})
              </span>
            </template>
          </el-table-column>
          <el-table-column label="朝向角" width="100" align="center">
            <template #default="{ row }">
              <span class="text-xs text-gray-500 font-mono">{{ radToDeg(row.rotationY) }}°</span>
            </template>
          </el-table-column>
          <el-table-column label="注视目标 (X, Y, Z)" min-width="150" align="center">
            <template #default="{ row }">
              <span class="font-mono text-xs text-gray-500">
                ({{ Number(row.cameraTargetX).toFixed(1) }}, {{ Number(row.cameraTargetY).toFixed(1) }}, {{ Number(row.cameraTargetZ).toFixed(1) }})
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="95" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'OUT_OF_STOCK' ? 'danger' : 'success'" size="small">
                {{ row.status === 'OUT_OF_STOCK' ? '已售罄' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="handleEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 右侧俯视布局小地图 -->
      <div class="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
        <div class="text-sm font-medium text-gray-700 mb-3 w-full flex justify-between items-center">
          <span>全场 3D 货架俯视分布图</span>
          <span v-if="selectedShelfForMap" class="text-xs text-blue-500">
            已选中: {{ selectedShelfForMap.shelfCode }}
          </span>
        </div>
        <ShelfMiniMap :shelves="shelves" :highlight="selectedShelfForMap" :size="340" />
      </div>
    </div>

    <!-- 编辑/新增弹窗 -->
    <ShelfFormDialog
      v-model="dialogVisible"
      :shelf="currentShelf"
      :shelves="shelves"
      @saved="onSaved"
    />
  </div>
</template>
