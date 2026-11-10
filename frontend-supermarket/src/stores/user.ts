/**
 * 用户登录态：Token 持久化到 localStorage，未授权时自动唤起登录框
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as api from '../api/order'
import { TOKEN_KEY, onUnauthorized } from '../api/http'

const NAME_KEY = 'dianshan_username'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const username = ref<string | null>(localStorage.getItem(NAME_KEY))
  /** 登录弹窗显示状态 */
  const loginVisible = ref(false)
  const isLoggedIn = computed(() => !!token.value)

  // 注册 401 回调：清空状态并弹出登录框
  onUnauthorized(() => {
    token.value = null
    loginVisible.value = true
  })

  async function login(name: string, password: string) {
    const vo = await api.login(name, password)
    token.value = vo.token
    username.value = vo.username
    localStorage.setItem(TOKEN_KEY, vo.token)
    localStorage.setItem(NAME_KEY, vo.username)
    loginVisible.value = false
  }

  async function register(name: string, password: string, phone?: string) {
    await api.register(name, password, phone)
    await login(name, password)
  }

  function logout() {
    token.value = null
    username.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(NAME_KEY)
  }

  /** 需要登录的操作前置校验，未登录时弹框并返回 false */
  function requireLogin(): boolean {
    if (!token.value) loginVisible.value = true
    return !!token.value
  }

  return { token, username, loginVisible, isLoggedIn, login, register, logout, requireLogin }
})
