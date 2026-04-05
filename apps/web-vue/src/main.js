import { createApp } from 'vue'
import App from './App.vue'
// 路由
import router from './router'
// Pinia
import { createPinia } from 'pinia'
import piniaStore from './stores' // Pinia 全局配置
//  Element Plus（企业级UI组件库）
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 全局样式
import '@/assets/styles/reset.scss' // 样式重置
import '@/assets/styles/common.scss' // 公共样式
// 自定义指令
import {setupDirectives} from './directives/index'
// 权限控制
import './permission'
// 接口请求（全局挂载）
import request from './api'

// 创建App实例
const app = createApp(App)

// 注册全局组件（Element Plus 图标）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载所有依赖
app.use(createPinia())
app.use(piniaStore)
app.use(router)
app.use(ElementPlus)
// app.use(directive)
setupDirectives(app)
// 全局挂载请求方法
app.config.globalProperties.$request = request
console.log('xx');

// 挂载根组件
app.mount('#app')