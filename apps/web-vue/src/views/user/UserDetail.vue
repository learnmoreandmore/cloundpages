<template>
  <div class="user-detail-container">
    <div class="detail-header">
      <el-button type="text" icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>用户详情</h2>
    </div>

    <el-card shadow="hover" class="detail-card">
      <el-form
        :model="userDetail"
        label-width="120px"
        class="detail-form"
        disabled
      >
        <el-form-item label="用户名">
          <el-input v-model="userDetail.userName" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="userDetail.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userDetail.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-input v-model="userDetail.roleName" />
        </el-form-item>
        <el-form-item label="状态">
          <el-input v-model="userDetail.statusText" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-input v-model="userDetail.createTime" />
        </el-form-item>
        <el-form-item label="最后登录时间">
          <el-input v-model="userDetail.lastLoginTime" />
        </el-form-item>
      </el-form>

      <div class="detail-footer">
        <el-button type="primary" @click="handleEdit">编辑用户</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userId = route.params.id // 从路由获取用户ID
const userDetail = ref({
  userName: '',
  phone: '',
  email: '',
  roleName: '',
  status: '1',
  statusText: '启用',
  createTime: '',
  lastLoginTime: ''
})

// 页面挂载时获取用户详情
onMounted(() => {
  getUserDetail()
})

// 获取用户详情（模拟接口）
const getUserDetail = async () => {
  try {
    // const res = await request.get(`/user/${userId}`)
    // userDetail.value = res.data
    // 模拟数据（根据用户ID匹配）
    const mockData = [
      {
        id: '1',
        userName: 'admin',
        phone: '13800138000',
        email: 'admin@example.com',
        roleName: '超级管理员',
        status: '1',
        statusText: '启用',
        createTime: '2024-01-01 10:00:00',
        lastLoginTime: '2024-05-01 09:30:00'
      },
      {
        id: '2',
        userName: 'test1',
        phone: '13800138001',
        email: 'test1@example.com',
        roleName: '普通用户',
        status: '1',
        statusText: '启用',
        createTime: '2024-01-02 14:30:00',
        lastLoginTime: '2024-04-28 16:45:00'
      },
      {
        id: '3',
        userName: 'test2',
        phone: '13800138002',
        email: 'test2@example.com',
        roleName: '普通用户',
        status: '0',
        statusText: '禁用',
        createTime: '2024-01-03 09:15:00',
        lastLoginTime: '2024-04-20 11:20:00'
      },
      {
        id: '4',
        userName: 'test3',
        phone: '13800138003',
        email: 'test3@example.com',
        roleName: '访客',
        status: '1',
        statusText: '启用',
        createTime: '2024-01-04 16:45:00',
        lastLoginTime: '2024-04-30 15:10:00'
      }
    ]
    const user = mockData.find(item => item.id === userId)
    if (user) {
      userDetail.value = user
    } else {
      ElMessage.warning('未找到该用户')
      router.push('/user/list')
    }
  } catch (error) {
    ElMessage.error('获取用户详情失败，请稍后重试')
    router.push('/user/list')
  }
}

// 编辑用户（跳转编辑页面，可复用UserList的编辑逻辑）
const handleEdit = () => {
  router.push({ path: '/user/list', query: { editId: userId } })
}
</script>

<style scoped lang="scss">
.user-detail-container {
  width: 100%;
  height: 100%;
  padding-bottom: 20px;

  .detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    el-button {
      color: #1890ff;
    }
  }

  .detail-card {
    padding: 20px;
    width: 600px;
    margin: 0 auto;

    .detail-form {
      margin-bottom: 30px;
    }

    .detail-footer {
      display: flex;
      justify-content: center;
    }
  }

  // 适配暗色模式
  :deep(.dark) {
    .detail-card {
      background: #1f2937;
    }

    h2,
    el-form-item label,
    el-input {
      color: #f3f4f6;
    }

    el-input__inner {
      background: #374151;
      border-color: #4b5563;
      color: #f3f4f6;
    }
  }
}
</style>