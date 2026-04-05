import { createRouter, createWebHistory } from 'vue-router'
import { publicRoutes, privateRoutes } from './routes'
import { useUserStore } from '@/stores/modules/userStore'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_BASE_URL), // 路由模式
  routes: [...publicRoutes, ...privateRoutes], // 合并路由
  scrollBehavior: () => ({ top: 0 }) // 页面跳转后滚动到顶部
})

// 路由前置守卫（权限控制核心）
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  // 1. 未登录：只能访问公共路由
  if (!token) {
    if (to.meta.hidden || publicRoutes.some(route => route.path === to.path)) {
      next()
    } else {
      next('/login') // 未登录，跳转登录页
    }
    return
  }

  // 2. 已登录：不能访问登录页
  if (to.path === '/login') {
    next('/home')
    return
  }

  // 3. 权限校验：判断当前用户角色是否有权访问该路由
  const hasPermission = () => {
    // 无需权限的路由（meta.roles 不存在）直接放行
    if (!to.meta.roles || to.meta.roles.length === 0) return true
    // 检查用户角色是否在路由允许的角色列表中
    return userStore.roles.some(role => to.meta.roles.includes(role))
  }

  if (hasPermission()) {
    next()
  } else {
    next('/404') // 无权限，跳转404
  }
})

// 路由后置守卫（设置页面标题）
router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title}`
  } else {
    document.title = 'web-vue'
  }
})

export default router