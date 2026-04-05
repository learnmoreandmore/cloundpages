<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h2 class="login-title">企业管理系统</h2>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="userName">
          <el-input
            v-model="loginForm.userName"
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            @click="handleLogin"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/modules/userStore'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

// 登录表单
const loginForm = reactive({
  userName: '',
  password: ''
})

// 表单校验规则
const loginRules = reactive({
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
})

// 登录提交
const handleLogin = async () => {
  // 表单校验
  const valid = await loginFormRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    await userStore.loginAction(loginForm)
    ElMessage.success('登录成功')
  } catch (error) {
    ElMessage.error(error.msg || '登录失败，请检查用户名或密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  justify-content: center;
  align-items: center;

  .login-form-wrapper {
    width: 400px;
    background: #fff;
    border-radius: 8px;
    padding: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    .login-title {
      text-align: center;
      margin-bottom: 30px;
      color: #1890ff;
      font-size: 24px;
      font-weight: 600;
    }

    .login-form {
      width: 100%;

      .login-btn {
        width: 100%;
        height: 44px;
        font-size: 16px;
      }
    }
  }
}
</style>