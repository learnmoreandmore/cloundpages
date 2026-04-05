import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate' // 状态持久化

// 创建Pinia实例
const pinia = createPinia()

// 配置Pinia持久化（可选，需安装：npm install pinia-plugin-persistedstate）
const persistPlugin = createPersistedState({
  // 全局默认配置
  storage: localStorage, // 存储方式：localStorage / sessionStorage
  key: (id) => `pinia_${id}`, // 存储key前缀
  auto: true // 自动持久化所有仓库
})

// 注册持久化插件
pinia.use(persistPlugin)

export default pinia