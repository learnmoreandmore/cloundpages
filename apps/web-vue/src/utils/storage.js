// 存储token（加密存储可选，这里简化处理）
export const setToken = (token) => {
  localStorage.setItem('token', token)
}

// 获取token
export const getToken = () => {
  return localStorage.getItem('token') || ''
}

// 删除token
export const removeToken = () => {
  localStorage.removeItem('token')
}

// 存储对象（JSON格式化）
export const setStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

// 获取对象（JSON解析）
export const getStorage = (key) => {
  const value = localStorage.getItem(key)
  return value ? JSON.parse(value) : null
}

// 删除存储
export const removeStorage = (key) => {
  localStorage.removeItem(key)
}