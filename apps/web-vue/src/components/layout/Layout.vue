<!-- src/components/layout/Layout.vue 全局布局组件（完整版） -->
<template>
  <div class="layout-container">
    <!-- 顶部导航 -->
    <header class="layout-header" v-if="!$route.meta.hidden">
      <div class="header-left">
        <el-button
          icon="Menu"
          size="small"
          @click="toggleSidebar"
          class="sidebar-toggle"
        />
        <h1 class="layout-title">企业管理系统</h1>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleDropdown">
          <span class="user-info">
            <el-avatar :icon="User" />
            <span class="user-name">{{ userStore.userName }}</span>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" type="danger">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    <div class="layout-content">
      <!-- 侧边栏 -->
      <aside
        class="layout-sidebar"
        :class="{ collapsed: systemStore.sidebarCollapse }"
        v-if="!$route.meta.hidden"
      >
        <el-menu
          :default-active="$route.path"
          class="sidebar-menu"
          router
          :collapse="systemStore.sidebarCollapse"
          :collapse-transition="false"
        >
          <template v-for="route in routes" :key="route.path">
            <!-- 有子路由的菜单 -->
            <el-sub-menu v-if="route.children && route.children.length" :index="route.path">
              <template #title>
                <el-icon><component :is="route.meta.icon" /></el-icon>
                <span>{{ route.meta.title }}</span>
              </template>
              <el-menu-item
                v-for="child in route.children"
                :key="child.path"
                :index="child.path"
                v-if="!child.meta.hidden"
              >
                {{ child.meta.title }}
              </el-menu-item>
            </el-sub-menu>
            <!-- 无子弹菜单 -->
            <el-menu-item
              v-else
              :index="route.path"
              v-if="!route.meta.hidden"
            >
              <el-icon><component :is="route.meta.icon" /></el-icon>
              <span>{{ route.meta.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </aside>
      <!-- 页面内容 -->
      <main class="layout-main">
        <!-- 面包屑 -->
        <el-breadcrumb class="breadcrumb" v-if="systemStore.breadcrumbList.length">
          <el-breadcrumb-item
            v-for="(item, index) in systemStore.breadcrumbList"
            :key="index"
            :to="item.path"
          >
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
        <!-- 路由出口 -->
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/modules/userStore'
import { useSystemStore } from '@/stores/modules/systemStore'
import { User, ArrowDown, Menu } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const systemStore = useSystemStore()
const router = useRouter()
const route = useRoute()

// 过滤出需要在侧边栏显示的路由（排除hidden为true的路由）
const routes = computed(() => {
  return router.getRoutes().filter(route => !route.meta.hidden && route.meta.title)
})

// 折叠/展开侧边栏
const toggleSidebar = () => {
  systemStore.toggleSidebar()
}

// 处理用户下拉菜单操作
const handleDropdown = (command) => {
  if (command === 'logout') {
    // 退出登录
    userStore.logoutAction()
    router.push('/login')
    ElMessage.success('退出登录成功')
  } else if (command === 'profile') {
    // 跳转到个人中心（假设个人中心路由为/user/detail/用户ID）
    if (userStore.userInfo?.id) {
      router.push(`/user/detail/${userStore.userInfo.id}`)
    } else {
      ElMessage.warning('无法获取用户信息，请重新登录')
      userStore.logoutAction()
      router.push('/login')
    }
  }
}

// 监听路由变化，更新面包屑导航
watch(
  () => route.path,
  (newPath) => {
    // 解析当前路由，生成面包屑列表
    const breadcrumbList = []
    let currentRoute = route.matched[0]
    if (currentRoute) {
      // 遍历匹配的路由，生成面包屑
      route.matched.forEach(item => {
        if (item.meta.title) {
          breadcrumbList.push({
            title: item.meta.title,
            path: item.path
          })
        }
      })
      // 更新Pinia中的面包屑状态
      systemStore.setBreadcrumb(breadcrumbList)
    }
  },
  { immediate: true } // 初始渲染时执行一次
)

// 校验用户登录状态（未登录跳转至登录页）
watch(
  () => userStore.token,
  (newToken) => {
    if (!newToken && route.path !== '/login') {
      router.push('/login')
      ElMessage.warning('请先登录')
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;

  // 顶部导航
  .layout-header {
    height: 60px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .sidebar-toggle {
        color: #1890ff;
        font-size: 18px;
      }

      .layout-title {
        font-size: 18px;
        font-weight: 600;
        color: #1890ff;
        margin: 0;
      }
    }

    .header-right {
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: #333;

        .user-name {
          font-size: 14px;
          font-weight: 500;
        }

        .dropdown-icon {
          font-size: 14px;
          color: #666;
        }
      }
    }
  }

  // 内容区域（侧边栏+主内容）
  .layout-content {
    display: flex;
    flex: 1;
    overflow: hidden;

    // 侧边栏
    .layout-sidebar {
      width: 220px;
      background: #fff;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
      transition: width 0.3s ease;
      overflow: hidden;

      &.collapsed {
        width: 64px;
      }

      .sidebar-menu {
        border-right: none;
        height: 100%;

        .el-sub-menu__title,
        .el-menu-item {
          display: flex;
          align-items: center;
          height: 50px;
          font-size: 14px;

          .el-icon {
            margin-right: 8px;
            color: #666;
          }
        }

        .el-sub-menu__title:hover,
        .el-menu-item:hover,
        .el-menu-item.is-active {
          background: rgba(24, 144, 255, 0.1);
          color: #1890ff;

          .el-icon {
            color: #1890ff;
          }
        }
      }
    }

    // 主内容区域
    .layout-main {
      flex: 1;
      padding: 20px;
      overflow-y: auto;

      .breadcrumb {
        margin-bottom: 20px;
        font-size: 14px;
      }
    }
  }
}

// 适配暗色模式
:deep(.dark) {
  .layout-container {
    background: #111827;
  }

  .layout-header,
  .layout-sidebar {
    background: #1f2937;
  }

  .layout-title,
  .user-info,
  .el-sub-menu__title,
  .el-menu-item,
  .el-breadcrumb {
    color: #f3f4f6;
  }

  .el-sub-menu__title:hover,
  .el-menu-item:hover,
  .el-menu-item.is-active {
    background: rgba(24, 144, 255, 0.2);
  }

  .el-icon {
    color: #d1d5db !important;
  }

  .el-breadcrumb__item:last-child .el-breadcrumb__inner {
    color: #f3f4f6 !important;
  }
}

// 适配小屏幕
@media (max-width: 768px) {
  .layout-sidebar {
    position: fixed;
    left: -220px;
    z-index: 999;
    height: 100vh;

    &.collapsed {
      left: 0;
      width: 64px;
    }

    &:hover {
      left: 0;
      width: 220px;
    }
  }

  .layout-main {
    padding: 16px;
  }
}
</style>