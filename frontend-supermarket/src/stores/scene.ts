/**
 * 3D 场景数据状态：货架/商铺、商品、当前选中商品、当前所处商铺，以及实时库存/售罄状态更新
 */
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { getScene } from '../api/supermarket'
import type { Product, SceneShelf, ShelfStatus, SupermarketScene } from '../types/api'
import { getWorld } from '../three/worldRef'

export const useSceneStore = defineStore('scene', () => {
  const scene = shallowRef<SupermarketScene | null>(null)
  const shelves = ref<SceneShelf[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 当前打开商品详情卡片的商品 ID */
  const selectedProductId = ref<number | null>(null)

  /** 当前用户正身处浏览的商铺 ID (shelfId) */
  const currentShopShelfId = ref<number | null>(null)

  const productById = computed(() => {
    const m = new Map<number, Product>()
    shelves.value.forEach((s) => s.products.forEach((p) => m.set(p.id, p)))
    return m
  })

  const selectedProduct = computed(() =>
    selectedProductId.value != null ? productById.value.get(selectedProductId.value) ?? null : null,
  )

  const selectedShelf = computed(() =>
    selectedProduct.value ? shelves.value.find((s) => s.id === selectedProduct.value!.shelfId) ?? null : null,
  )

  /** 当前正在店内导览的商铺数据 */
  const currentShop = computed(() =>
    currentShopShelfId.value != null ? shelves.value.find((s) => s.id === currentShopShelfId.value) ?? null : null,
  )

  /** 拉取全景场景树 */
  async function load() {
    loading.value = true
    error.value = null
    try {
      const data = await getScene()
      scene.value = data
      shelves.value = data.shelves
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  function selectProduct(id: number | null) {
    selectedProductId.value = id
  }

  /** 进入指定店铺店内深度浏览 */
  function enterShop(shelfId: number) {
    currentShopShelfId.value = shelfId
    getWorld()?.flyToShop(shelfId)
  }

  /** 走出店铺回到商业步行街大道 */
  function exitShop() {
    const prevId = currentShopShelfId.value
    currentShopShelfId.value = null
    getWorld()?.flyToStreet(prevId ?? undefined)
  }

  /** 更新商品实时库存，并同步 3D 商品陈列数量 */
  function updateProductStock(productId: number, stock: number) {
    const p = productById.value.get(productId)
    if (!p) return
    p.stock = stock
    getWorld()?.updateProductStock(productId, stock)
  }

  /** 更新货架售罄状态，并驱动 3D 红光呼吸材质切换 */
  function updateShelfStatus(shelfId: number | null, status: ShelfStatus) {
    if (shelfId == null) return
    const s = shelves.value.find((x) => x.id === shelfId)
    if (s) s.status = status
    getWorld()?.setShelfStatus(shelfId, status)
  }

  return {
    scene,
    shelves,
    loading,
    error,
    selectedProductId,
    selectedProduct,
    selectedShelf,
    currentShopShelfId,
    currentShop,
    productById,
    load,
    selectProduct,
    enterShop,
    exitShop,
    updateProductStock,
    updateShelfStatus,
  }
})
