import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/modules/userStore'
import { getToken } from '@/utils/storage'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API, // 基础路径（环境变量）
  timeout: 5000, // 超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器（添加token、设置请求头等）
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    // 添加token
    if (getToken()) {
      config.headers.Authorization = `Bearer ${getToken()}`
    }
    return config
  },
  (error) => {
    // 请求错误处理
    ElMessage.error('请求发送失败，请稍后重试')
    return Promise.reject(error)
  }
)

// 响应拦截器（处理响应数据、错误等）
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 状态码判断（根据后端接口规范调整）
    if (res.code !== 200) {
      // 错误提示
      ElMessage.error(res.msg || '操作失败，请稍后重试')
      // 401：未授权（token过期、无效），跳转登录页
      if (res.code === 401) {
        const userStore = useUserStore()
        ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          userStore.logoutAction() // 清除状态，跳转登录
        })
      }
      return Promise.reject(res)
    }
    // 成功返回数据
    return res
  },
  (error) => {
    // 网络错误、超时等处理
    let message = ''
    if (error.message.includes('Network Error')) {
      message = '网络异常，请检查网络连接'
    } else if (error.message.includes('timeout')) {
      message = '请求超时，请稍后重试'
    } else {
      message = error.message || '服务器异常，请稍后重试'
    }
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// 封装请求方法（get、post、put、delete）
export const request = {
  get(url, params = {}) {
    return service({
      url,
      method: 'get',
      params
    })
  },
  post(url, data = {}) {
    return service({
      url,
      method: 'post',
      data
    })
  },
  put(url, data = {}) {
    return service({
      url,
      method: 'put',
      data
    })
  },
  delete(url, params = {}) {
    return service({
      url,
      method: 'delete',
      params
    })
  }
}

export default request