import request from './index'

// 登录接口
export const login = (data) => {
  return request.post('/user/login', data)
}

// 获取用户信息接口
export const getUserInfo = () => {
  return request.get('/user/info')
}

// 退出登录接口
export const logout = () => {
  return request.post('/user/logout')
}

// 获取用户列表接口
export const getUserList = (params) => {
  return request.get('/user/list', params)
}

// 编辑用户接口
export const editUser = (data) => {
  return request.put('/user/edit', data)
}