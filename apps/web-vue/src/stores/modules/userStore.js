import { defineStore } from 'pinia'
import { login, getUserInfo, logout } from '@/api/user'
import { setToken, getToken, removeToken } from '@/utils/storage'

// 用户状态仓库（持久化配置：单独配置，覆盖全局）
export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '', // 登录令牌（持久化）
    userInfo: {}, // 用户信息
    roles: [], // 用户角色（用于权限控制）
    permissions: [] // 用户权限（按钮级权限）
  }),
  getters: {
    // 判断是否登录
    isLogin: (state) => !!state.token,
    // 获取用户名
    userName: (state) => state.userInfo?.userName || '未知用户'
  },
  actions: {
    // 登录操作
    async loginAction(data) {
      try {
        const res = await login(data) // 调用登录接口
        const { token } = res.data
        // 存储token
        this.token = token
        setToken(token)
        // 登录成功后获取用户信息
        await this.getUserInfoAction()
        return res
      } catch (error) {
        throw error
      }
    },
    // 获取用户信息
    async getUserInfoAction() {
      try {
        const res = await getUserInfo()
        const { userInfo, roles, permissions } = res.data
        this.userInfo = userInfo
        this.roles = roles
        this.permissions = permissions
        return res
      } catch (error) {
        // 信息获取失败，清除token并跳转登录
        this.logoutAction()
        throw error
      }
    },
    // 退出登录
    async logoutAction() {
      try {
        await logout() // 调用退出接口
      } finally {
        // 清除状态和存储
        this.token = ''
        this.userInfo = {}
        this.roles = []
        this.permissions = []
        removeToken()
        // 跳转登录页（需引入router，避免循环依赖，用window.location跳转）
        window.location.href = '/login'
      }
    }
  },
  // 单独配置持久化（只持久化token，用户信息不持久化，避免缓存过期）
  persist: {
    paths: ['token'],
    storage: localStorage
  }
})