/**
 * 安全本地存储辅助工具 (兼容无 localStorage 的测试与受限沙箱环境)
 */
const memoryStorage = new Map<string, string>();

export function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== "undefined" && typeof window.localStorage?.getItem === "function") {
      return window.localStorage.getItem(key);
    }
  } catch {
    // 忽略沙箱异常
  }
  return memoryStorage.get(key) ?? null;
}

export function safeSetStorage(key: string, value: string): void {
  memoryStorage.set(key, value);
  try {
    if (typeof window !== "undefined" && typeof window.localStorage?.setItem === "function") {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // 忽略沙箱异常
  }
}

export function safeRemoveStorage(key: string): void {
  memoryStorage.delete(key);
  try {
    if (typeof window !== "undefined" && typeof window.localStorage?.removeItem === "function") {
      window.localStorage.removeItem(key);
    }
  } catch {
    // 忽略沙箱异常
  }
}
