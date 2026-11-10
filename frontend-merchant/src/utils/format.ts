/**
 * 通用格式化工具
 */

/** 文件大小格式化：B / KB / MB / GB */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${i === 0 ? v : v.toFixed(1)} ${units[i]}`
}

/** 日期时间格式化：兼容后端 LocalDateTime 字符串（ISO）或数组形式 */
export function formatDateTime(v: unknown): string {
  if (v == null || v === '') return '-'
  if (Array.isArray(v)) {
    const [y, m, d, hh = 0, mm = 0, ss = 0] = v as number[]
    const p = (n: number) => String(n).padStart(2, '0')
    return `${y}-${p(m)}-${p(d)} ${p(hh)}:${p(mm)}:${p(ss)}`
  }
  return String(v).replace('T', ' ').slice(0, 19)
}

/** 弧度转角度（保留 1 位小数），用于货架朝向展示 */
export function radToDeg(rad: number | null | undefined): string {
  if (rad == null || !Number.isFinite(rad)) return '-'
  return ((rad * 180) / Math.PI).toFixed(1)
}
