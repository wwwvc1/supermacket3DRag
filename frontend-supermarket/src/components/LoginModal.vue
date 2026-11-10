<script setup lang="ts">
/**
 * 用户登录 / 注册模态弹窗 (LoginModal)
 */
import { ref } from 'vue'
import { X, Lock, User, Phone, Sparkles } from 'lucide-vue-next'
import { useUserStore } from '../stores/user'
import { useToastStore } from '../stores/toast'

const userStore = useUserStore()
const toastStore = useToastStore()

const isRegister = ref(false)
const username = ref('testuser')
const password = ref('123456')
const phone = ref('13800138000')
const loading = ref(false)

async function handleSubmit() {
  if (!username.value.trim() || !password.value.trim()) {
    toastStore.push('请输入用户名与密码', 'warning')
    return
  }
  loading.value = true
  try {
    if (isRegister.value) {
      await userStore.register(username.value.trim(), password.value.trim(), phone.value.trim())
      toastStore.push('注册并登录成功！', 'success')
    } else {
      await userStore.login(username.value.trim(), password.value.trim())
      toastStore.push(`欢迎回来，${username.value}！`, 'success')
    }
  } catch (err: any) {
    toastStore.push(err.message || '操作失败', 'error')
  } finally {
    loading.value = false
  }
}

function fillDemoUser() {
  username.value = 'testuser'
  password.value = '123456'
  phone.value = '13800138000'
}
</script>

<template>
  <div v-if="userStore.loginVisible" class="fixed inset-0 z-50 flex items-center justify-center select-none">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="userStore.loginVisible = false" />

    <div
      class="relative w-96 rounded-3xl bg-slate-900 border border-slate-700/80 p-6 text-white shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
    >
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-cyan-400" />
          <span>{{ isRegister ? '创建新账户' : '用户身份登录' }}</span>
        </h3>
        <button
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          @click="userStore.loginVisible = false"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 表单 -->
      <form class="space-y-3" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-[11px] font-medium text-slate-400 mb-1">用户名</label>
          <div class="relative flex items-center">
            <input
              v-model="username"
              type="text"
              class="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              placeholder="请输入用户名"
            />
            <User class="w-4 h-4 text-slate-400 absolute left-3" />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-medium text-slate-400 mb-1">登录密码</label>
          <div class="relative flex items-center">
            <input
              v-model="password"
              type="password"
              class="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              placeholder="请输入密码"
            />
            <Lock class="w-4 h-4 text-slate-400 absolute left-3" />
          </div>
        </div>

        <div v-if="isRegister">
          <label class="block text-[11px] font-medium text-slate-400 mb-1">手机号码 (选填)</label>
          <div class="relative flex items-center">
            <input
              v-model="phone"
              type="text"
              class="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              placeholder="请输入手机号"
            />
            <Phone class="w-4 h-4 text-slate-400 absolute left-3" />
          </div>
        </div>

        <!-- 快速填充测试账号提示 -->
        <div class="flex items-center justify-between pt-1">
          <button
            type="button"
            class="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition"
            @click="fillDemoUser"
          >
            一键填入测试账号 (testuser)
          </button>
          <button
            type="button"
            class="text-[11px] text-slate-400 hover:text-slate-300 transition"
            @click="isRegister = !isRegister"
          >
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </button>
        </div>

        <button
          type="submit"
          class="w-full h-11 mt-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition active:scale-98 disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? '验证中...' : isRegister ? '立即注册并登录' : '立即登录' }}
        </button>
      </form>
    </div>
  </div>
</template>
