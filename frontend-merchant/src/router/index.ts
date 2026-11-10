import { createRouter, createWebHistory } from 'vue-router'

/** 商户后台路由：商品管理 / 货架点位 / 知识库文档 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/products' },
    {
      path: '/products',
      name: 'products',
      component: () => import('@/views/ProductManageView.vue'),
      meta: { title: '商品管理' }
    },
    {
      path: '/shelves',
      name: 'shelves',
      component: () => import('@/views/ShelfManageView.vue'),
      meta: { title: '货架点位' }
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: () => import('@/views/KnowledgeView.vue'),
      meta: { title: '知识库文档' }
    },
    { path: '/:pathMatch(.*)*', redirect: '/products' }
  ]
})

// 同步浏览器标题
router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? '商户后台'
  document.title = `${title} · 数字孪生超市商户后台`
})

export default router
