import { defineStore } from 'pinia'

// 系统状态仓库（主题、加载状态等）
export const useSystemStore = defineStore('system', {
  state: () => ({
    theme: 'light', // 主题：light（亮色）/ dark（暗色）
    loading: false, // 全局加载状态
    sidebarCollapse: false, // 侧边栏折叠状态
    breadcrumbList: [] // 面包屑导航数据
  }),
  actions: {
    // 切换主题
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      // 同步修改页面主题类名（配合全局样式）
      document.documentElement.className = this.theme
    },
    // 设置全局加载状态
    setLoading(status) {
      this.loading = status
    },
    // 设置面包屑
    setBreadcrumbList(list) {
      this.breadcrumbList = list
    },
    // 折叠/展开侧边栏
    toggleSidebar() {
      this.sidebarCollapse = !this.sidebarCollapse
    }
  },
  // 持久化主题和侧边栏状态
  persist: {
    paths: ['theme', 'sidebarCollapse']
  }
})