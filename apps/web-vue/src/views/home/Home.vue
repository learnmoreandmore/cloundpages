<template>
  <div class="home-container">
    <!-- 欢迎区域 -->
    <div class="welcome-card">
      <div class="welcome-content">
        <h2>欢迎回来，{{ userStore.userName }} 👋</h2>
        <p class="login-info">
          上次登录时间：{{ lastLoginTime }}
          <span class="login-ip">| 登录IP：{{ loginIp }}</span>
        </p>
        <div class="theme-toggle">
          <el-button
            type="text"
            icon="Moon"
            @click="systemStore.toggleTheme"
            v-if="systemStore.theme === 'light'"
          >
            切换暗色模式
          </el-button>
          <el-button
            type="text"
            icon="Sunny"
            @click="systemStore.toggleTheme"
            v-else
          >
            切换亮色模式
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-container">
      <el-card class="stats-card" shadow="hover">
        <div class="stats-header">
          <el-icon class="stats-icon"><User /></el-icon>
          <h3>用户总数</h3>
        </div>
        <div class="stats-value">{{ userCount }}</div>
        <div class="stats-trend">
          <span class="trend-up">↑ 12.5%</span>
          <span class="trend-desc">较上月</span>
        </div>
      </el-card>

      <el-card class="stats-card" shadow="hover">
        <div class="stats-header">
          <el-icon class="stats-icon"><Setting /></el-icon>
          <h3>系统模块</h3>
        </div>
        <div class="stats-value">{{ moduleCount }}</div>
        <div class="stats-trend">
          <span class="trend-up">↑ 5.3%</span>
          <span class="trend-desc">较上月</span>
        </div>
      </el-card>

      <el-card class="stats-card" shadow="hover">
        <div class="stats-header">
          <el-icon class="stats-icon"><Message /></el-icon>
          <h3>待处理消息</h3>
        </div>
        <div class="stats-value">{{ messageCount }}</div>
        <div class="stats-trend">
          <span class="trend-down">↓ 3.1%</span>
          <span class="trend-desc">较上月</span>
        </div>
      </el-card>

      <el-card class="stats-card" shadow="hover">
        <div class="stats-header">
          <el-icon class="stats-icon"><CircleCheck /></el-icon>
          <h3>今日完成任务</h3>
        </div>
        <div class="stats-value">{{ taskCount }}</div>
        <div class="stats-trend">
          <span class="trend-up">↑ 8.7%</span>
          <span class="trend-desc">较昨日</span>
        </div>
      </el-card>
    </div>

    <!-- 最近操作记录 -->
    <div class="operation-record">
      <el-card shadow="hover">
        <div class="card-header">
          <h3>最近操作记录</h3>
          <el-button type="text" size="small" @click="refreshOperation">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
        <el-table :data="operationList" border stripe>
          <el-table-column label="操作时间" prop="time" width="180" />
          <el-table-column label="操作人" prop="operator" width="120" />
          <el-table-column label="操作内容" prop="content" />
          <el-table-column label="操作状态" prop="status" width="120">
            <template #default="scope">
              <el-tag type="success" v-if="scope.row.status === 'success'">成功</el-tag>
              <el-tag type="danger" v-else-if="scope.row.status === 'fail'">失败</el-tag>
              <el-tag type="warning" v-else>进行中</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-operation">
      <el-card shadow="hover">
        <div class="card-header">
          <h3>快捷操作</h3>
        </div>
        <div class="quick-buttons">
          <el-button
            type="primary"
            icon="User"
            @click="$router.push('/user/list')"
            class="quick-btn"
          >
            用户管理
          </el-button>
          <el-button
            type="primary"
            icon="Setting"
            @click="$router.push('/system/menu')"
            class="quick-btn"
          >
            菜单管理
          </el-button>
          <el-button
            type="primary"
            icon="Memo"
            @click="$router.push('/system/role')"
            class="quick-btn"
          >
            角色管理
          </el-button>
          <el-button
            type="primary"
            icon="Upload"
            class="quick-btn"
          >
            数据导入
          </el-button>
          <el-button
            type="primary"
            icon="Download"
            class="quick-btn"
          >
            数据导出
          </el-button>
          <el-button
            type="primary"
            icon="Help"
            class="quick-btn"
          >
            帮助中心
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/modules/userStore'
import { useSystemStore } from '@/stores/modules/systemStore'
import { formatTime } from '@/utils/format'
import { 
  User, Setting, Message, CircleCheck, 
  Moon, Sunny, Refresh, Memo, Upload, Download, Help 
} from '@element-plus/icons-vue'

// 引入Pinia仓库
const userStore = useUserStore()
const systemStore = useSystemStore()

// 统计数据（模拟接口返回，实际项目替换为接口请求）
const userCount = ref(1286)
const moduleCount = ref(18)
const messageCount = ref(23)
const taskCount = ref(15)

// 登录信息（模拟数据，实际从接口获取）
const lastLoginTime = ref('')
const loginIp = ref('192.168.1.100')

// 最近操作记录（模拟数据）
const operationList = ref([
  {
    time: formatTime(new Date(Date.now() - 3600000)),
    operator: userStore.userName,
    content: '修改个人信息',
    status: 'success'
  },
  {
    time: formatTime(new Date(Date.now() - 86400000)),
    operator: userStore.userName,
    content: '查看用户列表',
    status: 'success'
  },
  {
    time: formatTime(new Date(Date.now() - 172800000)),
    operator: userStore.userName,
    content: '编辑角色权限',
    status: 'success'
  },
  {
    time: formatTime(new Date(Date.now() - 259200000)),
    operator: userStore.userName,
    content: '导入用户数据',
    status: 'fail'
  },
  {
    time: formatTime(new Date(Date.now() - 345600000)),
    operator: userStore.userName,
    content: '创建新用户',
    status: 'success'
  }
])

// 页面挂载时初始化数据
onMounted(() => {
  // 模拟上次登录时间（7天前）
  lastLoginTime.value = formatTime(new Date(Date.now() - 604800000))
  // 实际项目中此处可调用接口获取首页统计数据
  // getHomeStats()
})

// 刷新操作记录
const refreshOperation = () => {
  // 模拟刷新，实际调用接口
  operationList.value.unshift({
    time: formatTime(new Date()),
    operator: userStore.userName,
    content: '刷新操作记录',
    status: 'success'
  })
  // 保留最近5条记录
  if (operationList.value.length > 5) {
    operationList.value.pop()
  }
}

// 模拟接口请求（实际项目替换为真实接口）
// const getHomeStats = async () => {
//   try {
//     const res = await request.get('/home/stats')
//     userCount.value = res.data.userCount
//     moduleCount.value = res.data.moduleCount
//     messageCount.value = res.data.messageCount
//     taskCount.value = res.data.taskCount
//     lastLoginTime.value = formatTime(res.data.lastLoginTime)
//     loginIp.value = res.data.loginIp
//     operationList.value = res.data.operationList
//   } catch (error) {
//     ElMessage.error('获取首页数据失败')
//   }
// }
</script>

<style scoped lang="scss">
.home-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 20px;

  // 欢迎区域
  .welcome-card {
    width: 100%;
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }

      .login-info {
        font-size: 14px;
        color: #666;
        margin-top: 8px;
        .login-ip {
          margin-left: 8px;
          color: #999;
        }
      }

      .theme-toggle {
        el-button {
          color: #1890ff;
          &:hover {
            color: #096dd9;
            background: rgba(24, 144, 255, 0.1);
          }
        }
      }
    }
  }

  // 统计卡片区域
  .stats-container {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;

    .stats-card {
      flex: 1;
      min-width: 200px;
      height: 160px;
      display: flex;
      flex-direction: column;
      padding: 16px;

      .stats-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;

        .stats-icon {
          font-size: 20px;
          color: #1890ff;
        }

        h3 {
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }
      }

      .stats-value {
        font-size: 28px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
      }

      .stats-trend {
        display: flex;
        align-items: center;
        gap: 8px;

        .trend-up {
          font-size: 12px;
          color: #52c41a;
        }

        .trend-down {
          font-size: 12px;
          color: #f5222d;
        }

        .trend-desc {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }

  // 操作记录和快捷操作区域
  .operation-record,
  .quick-operation {
    width: 100%;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h3 {
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }

      el-button {
        color: #1890ff;
        padding: 0;
      }
    }

    el-card {
      width: 100%;
      padding: 16px;
    }
  }

  // 快捷操作按钮
  .quick-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;

    .quick-btn {
      width: 120px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  }

  // 适配暗色模式
  :deep(.dark) {
    .welcome-card,
    el-card {
      background: #1f2937;
    }

    h2,
    h3,
    .stats-value,
    el-table th,
    el-table td {
      color: #f3f4f6;
    }

    .login-info,
    .trend-desc,
    el-table {
      color: #d1d5db;
    }

    el-table {
      --el-table-border-color: #374151;
      --el-table-row-hover-bg-color: #374151;
    }
  }
}
</style>