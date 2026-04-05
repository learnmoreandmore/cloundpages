// 时间格式化（yyyy-MM-dd HH:mm:ss）
export const formatTime = (time,type='yyyy-mm-dd',sep = '-') => {
  if (!time) return ''
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  if (type === 'yyyy-mm-dd') return `${year}${sep}${month}${sep}${day}`
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}${sep}${month}${sep}${day} ${hours}:${minutes}:${seconds}`
}

// 金额格式化（保留2位小数，添加千分位）
export const formatMoney = (money) => {
  if (isNaN(money)) return '0.00'
  return Number(money).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}