// 公共路由（无需权限）
export const publicRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: {
      title: '登录',
      hidden: true // 不在侧边栏显示
    }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面不存在',
      hidden: true
    }
  },
  {
    path: '/',
    redirect: '/home',
    meta: {
      hidden: true
    }
  }
]

// 私有路由（需要登录 + 对应权限）
export const privateRoutes = [
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/Home.vue'),
    meta: {
      title: '首页',
      icon: 'HomeFilled', // Element Plus 图标
      roles: ['admin', 'user'] // 可访问角色
    }
  },
  // 用户管理模块
  {
    path: '/user',
    name: 'User',
    component: () => import('@/components/layout/Layout.vue'),
    meta: {
      title: '用户管理',
      icon: 'User',
      roles: ['admin'] // 只有admin可访问
    },
    children: [
      {
        path: 'list',
        name: 'UserList',
        component: () => import('@/views/user/UserList.vue'),
        meta: {
          title: '用户列表',
          roles: ['admin']
        }
      },
      {
        path: 'detail/:id',
        name: 'UserDetail',
        component: () => import('@/views/user/UserDetail.vue'),
        meta: {
          title: '用户详情',
          hidden: true, // 不在侧边栏显示
          roles: ['admin']
        }
      }
    ]
  },
  // 系统管理模块
  {
    path: '/system',
    name: 'System',
    component: () => import('@/components/layout/Layout.vue'),
    meta: {
      title: '系统管理',
      icon: 'Setting',
      roles: ['admin']
    },
    children: [
      {
        path: 'menu',
        name: 'Menu',
        component: () => import('@/views/system/Menu.vue'),
        meta: {
          title: '菜单管理',
          roles: ['admin']
        }
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/system/Role.vue'),
        meta: {
          title: '角色管理',
          roles: ['admin']
        }
      }
    ]
  }
]