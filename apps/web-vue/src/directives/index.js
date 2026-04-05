// directives.js 全局自定义指令（适配企业管理系统，复用常用交互逻辑）
import { ElMessage } from 'element-plus'

// 注册全局自定义指令
export const setupDirectives = (app) => {
  // 1. 权限指令（根据用户权限控制元素显示/隐藏）
  app.directive('permission', {
    mounted(el, binding) {
      // 获取当前用户拥有的权限列表（从Pinia/本地存储中获取，需根据项目实际修改）
      const userPermissions = localStorage.getItem('userPermissions') 
        ? JSON.parse(localStorage.getItem('userPermissions')) 
        : []
      const requiredPermission = binding.value // 指令绑定的权限值（如：'system:menu:edit'）

      // 若用户无该权限，隐藏元素
      if (requiredPermission && !userPermissions.includes(requiredPermission)) {
        el.style.display = 'none'
        // 可选：添加注释，便于调试
        el.setAttribute('data-permission-hidden', 'true')
      }
    }
  })

  // 2. 防抖指令（防止按钮、输入框重复触发）
  app.directive('debounce', {
    mounted(el, binding) {
      const { value, arg = 500 } = binding // value：触发的方法，arg：防抖时间（默认500ms）
      if (typeof value !== 'function') {
        console.error('v-debounce 指令绑定的值必须是函数')
        return
      }

      let timer = null
      // 给元素绑定点击事件（适配按钮、输入框等）
      el.addEventListener('click', () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          value()
        }, arg)
      })
    }
  })

  // 3. 节流指令（限制高频触发事件，如滚动、resize）
  app.directive('throttle', {
    mounted(el, binding) {
      const { value, arg = 1000 } = binding // value：触发的方法，arg：节流时间（默认1000ms）
      if (typeof value !== 'function') {
        console.error('v-throttle 指令绑定的值必须是函数')
        return
      }

      let lastTime = 0
      el.addEventListener('scroll', () => {
        const currentTime = Date.now()
        if (currentTime - lastTime >= arg) {
          value()
          lastTime = currentTime
        }
      })
    }
  })

  // 4. 输入框限制指令（限制输入类型：数字、整数、正整数等）
  app.directive('input-limit', {
    mounted(el, binding) {
      const input = el.tagName === 'INPUT' ? el : el.querySelector('input')
      if (!input) {
        console.error('v-input-limit 指令需绑定在input元素或包含input的元素上')
        return
      }

      const type = binding.value || 'number' // 默认为数字限制
      // 正则表达式（根据类型匹配）
      const regMap = {
        number: /[^0-9.]/g,        // 数字（含小数）
        integer: /[^0-9]/g,        // 整数
        positive: /[^0-9.]/g,      // 正数字（含小数）
        positiveInt: /[^0-9]/g,    // 正整数
        phone: /[^0-9]/g           // 手机号（仅数字）
      }

      const reg = regMap[type]
      if (!reg) {
        console.error('v-input-limit 指令支持的类型：number、integer、positive、positiveInt、phone')
        return
      }

      // 输入事件监听
      input.addEventListener('input', () => {
        let value = input.value.replace(reg, '')
        // 特殊处理：正数字、正整数（不能以0开头，除非是0本身）
        if (type === 'positive' || type === 'positiveInt') {
          if (value.startsWith('0') && value.length > 1) {
            value = value.replace(/^0+/, '0')
          }
          // 正数字不能有多个小数点
          if (type === 'positive' && value.split('.').length > 2) {
            value = value.split('.').slice(0, 2).join('.')
          }
        }
        input.value = value
        // 触发input事件（解决v-model绑定不更新问题）
        input.dispatchEvent(new Event('input'))
      })
    }
  })

  // 5. 禁止复制粘贴指令（用于敏感输入框，如密码、验证码）
  app.directive('no-copy', {
    mounted(el) {
      const input = el.tagName === 'INPUT' ? el : el.querySelector('input')
      if (!input) return

      // 禁止复制
      input.addEventListener('copy', (e) => {
        e.preventDefault()
        ElMessage.warning('该内容禁止复制')
      })
      // 禁止粘贴
      input.addEventListener('paste', (e) => {
        e.preventDefault()
        ElMessage.warning('该内容禁止粘贴')
      })
      // 禁止剪切
      input.addEventListener('cut', (e) => {
        e.preventDefault()
        ElMessage.warning('该内容禁止剪切')
      })
    }
  })

  // 6. 滚动到顶部指令（点击元素滚动到页面顶部）
  app.directive('scroll-top', {
    mounted(el, binding) {
      const duration = binding.value || 500 // 滚动动画时长（默认500ms）
      el.addEventListener('click', () => {
        // 平滑滚动到顶部
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      })
    }
  })

  // 7. 暗色模式切换指令（控制元素在明暗模式下的样式）
  app.directive('dark-mode', {
    mounted(el, binding) {
      const darkClass = binding.value || 'dark-element' // 暗色模式下的类名（默认dark-element）
      // 监听暗色模式切换（需根据项目中暗色模式的控制逻辑修改）
      const updateDarkMode = () => {
        const isDark = document.documentElement.classList.contains('dark')
        if (isDark) {
          el.classList.add(darkClass)
        } else {
          el.classList.remove(darkClass)
        }
      }

      // 初始执行一次
      updateDarkMode()
      // 监听暗色模式变化（假设项目中通过dark类控制暗色模式）
      window.addEventListener('dark-mode-change', updateDarkMode)
      // 解绑时移除监听
      el._unbindDarkMode = () => {
        window.removeEventListener('dark-mode-change', updateDarkMode)
      }
    },
    unmounted(el) {
      // 解绑监听
      if (el._unbindDarkMode) {
        el._unbindDarkMode()
      }
    }
  })
}

// 用法说明（可单独提取到注释文档，此处便于参考）
// 1. 权限指令：<el-button v-permission="'system:menu:add'">新增菜单</el-button>
// 2. 防抖指令：<el-button v-debounce:[500]="handleSubmit">提交</el-button>
// 3. 节流指令：<div v-throttle:[1000]="handleScroll" class="scroll-container"></div>
// 4. 输入限制：<el-input v-input-limit="'positiveInt'" placeholder="请输入正整数"></el-input>
// 5. 禁止复制：<el-input v-no-copy type="password" placeholder="请输入密码"></el-input>
// 6. 滚动顶部：<el-button v-scroll-top:[300]>回到顶部</el-button>
// 7. 暗色模式：<div v-dark-mode="custom-dark-class">内容</div>