<script setup lang="ts">
/**
 * 商户后台根布局：左侧导航 + 顶部状态栏 + 内容区
 */
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Goods, Grid, Document } from '@element-plus/icons-vue'
import { useWebSocketStore } from '@/stores/websocket'

const route = useRoute()
const wsStore = useWebSocketStore()

/** 当前激活菜单 */
const activeMenu = computed(() => route.path)

/** 连接状态展示文案与颜色 */
const wsView = computed(() => {
  switch (wsStore.status) {
    case 'connected':
      return { text: '实时通道已连接', color: '#67c23a' }
    case 'reconnecting':
      return { text: '实时通道重连中', color: '#e6a23c' }
    default:
      return { text: '实时通道连接中', color: '#909399' }
  }
})

onMounted(() => wsStore.connect())
onBeforeUnmount(() => wsStore.disconnect())
</script>

<template>
  <el-container class="h-full">
    <el-aside width="208px" class="bg-white border-r border-gray-200">
      <div class="h-14 flex items-center px-5 text-base font-semibold text-gray-800 border-b border-gray-100">
        🛒 商户后台
      </div>
      <el-menu :default-active="activeMenu" router class="!border-r-0">
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/shelves">
          <el-icon><Grid /></el-icon>
          <span>货架点位</span>
        </el-menu-item>
        <el-menu-item index="/knowledge">
          <el-icon><Document /></el-icon>
          <span>知识库文档</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="bg-white border-b border-gray-200 flex items-center justify-between" height="56px">
        <span class="text-gray-700 font-medium">{{ route.meta.title ?? '商户后台' }}</span>
        <span class="flex items-center gap-2 text-sm text-gray-500">
          <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: wsView.color }" />
          {{ wsView.text }}
        </span>
      </el-header>
      <el-main class="p-5">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
