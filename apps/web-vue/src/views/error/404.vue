<!-- src/views/error/404.vue 404页面 -->
<template>
  <div class="error-404">
    <div class="error-container">
      <h1 class="error-code">404</h1>
      <h2 class="error-message">页面不存在</h2>
      <p class="error-desc">抱歉，您访问的页面不存在、已被删除或地址错误</p>
      <el-button type="primary" @click="$router.push('/home')" class="back-btn">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.error-404 {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;

  .error-container {
    text-align: center;
    padding: 40px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);

    .error-code {
      font-size: 80px;
      font-weight: 700;
      color: #f5222d;
      margin-bottom: 20px;
    }

    .error-message {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
    }

    .error-desc {
      font-size: 14px;
      color: #666;
      margin-bottom: 30px;
    }

    .back-btn {
      width: 120px;
      height: 44px;
      font-size: 16px;
    }
  }

  // 适配暗色模式
  :deep(.dark) {
    background: #111827;

    .error-container {
      background: #1f2937;
    }

    .error-message,
    .error-desc {
      color: #f3f4f6;
    }
  }
}
</style>