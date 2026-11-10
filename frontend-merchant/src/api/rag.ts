import { request } from './http'
import type { KnowledgeDocument } from '@/types/api'

/** Embedding 引擎类型：本地 ONNX / 云端 OpenAI 兼容 */
export type EmbeddingProvider = 'local' | 'online'

/** 上传知识库文档（multipart 字段名为 file） */
export function uploadDocument(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request<KnowledgeDocument>({
    url: '/api/rag/upload',
    method: 'post',
    data: form,
    timeout: 300000
  })
}

/** 查询已入库文档列表 */
export function listDocuments() {
  return request<KnowledgeDocument[]>({ url: '/api/rag/documents', method: 'get' })
}

/** 切换 Embedding 引擎（provider 为 query 参数），返回提示文案 */
export function switchEmbedding(provider: EmbeddingProvider) {
  return request<string>({ url: '/api/rag/embedding/switch', method: 'post', params: { provider } })
}
