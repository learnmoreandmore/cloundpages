# cloundpages
```
web-vue/
├── public/                  # 静态资源（不被打包，直接引用）
│   ├── favicon.ico          # 网站图标
│   └── static/              # 静态文件（如图片、字体）
├── src/
│   ├── api/                 # 接口请求封装（按模块划分）
│   │   ├── index.js         # 请求拦截、响应拦截配置
│   │   ├── user.js          # 用户模块接口
│   │   └── system.js        # 系统模块接口
│   ├── assets/              # 可打包静态资源
│   │   ├── icons/           # 图标资源（svg、iconfont）
│   │   ├── images/          # 图片资源
│   │   └── styles/          # 全局样式（重置、变量、公共样式）
│   ├── components/          # 组件封装
│   │   ├── common/          # 公共基础组件（按钮、输入框、弹窗等）
│   │   ├── layout/          # 布局组件（页面框架、侧边栏、顶部导航等）
│   │   └── business/        # 业务组件（按业务模块划分）
│   ├── directives/          # 自定义指令（权限、防抖、节流等）
│   ├── hooks/               # 自定义 hooks（复用逻辑）
│   │   ├── usePermission.js # 权限控制 hooks
│   │   ├── useRequest.js    # 请求相关 hooks
│   │   └── useStorage.js    # 本地存储 hooks
│   ├── router/              # 路由管理
│   │   ├── index.js         # 路由配置（含路由守卫）
│   │   └── routes.js        # 路由规则（按模块拆分）
│   ├── stores/              # Pinia 状态管理（按模块划分）
│   │   ├── index.js         # Pinia 实例化（全局注册）
│   │   ├── modules/         # 模块仓库
│   │   │   ├── userStore.js # 用户状态（登录、权限、个人信息）
│   │   │   └── systemStore.js # 系统状态（主题、加载状态等）
│   ├── utils/               # 工具函数（通用方法）
│   │   ├── format.js        # 格式化工具（时间、金额等）
│   │   ├── validate.js      # 校验工具（表单校验等）
│   │   └── common.js        # 通用工具（防抖、节流、深拷贝等）
│   ├── views/               # 页面视图（按业务模块划分）
│   │   ├── login/           # 登录页面
│   │   ├── home/            # 首页
│   │   ├── user/            # 用户管理模块
│   │   └── system/          # 系统管理模块
│   ├── App.vue              # 根组件
│   ├── main.js              # 入口文件（初始化 App、路由、Pinia 等）
│   └── permission.js        # 全局权限控制（路由守卫、权限判断）
├── .env.development         # 开发环境配置
├── .env.production          # 生产环境配置
├── .env.test                # 测试环境配置
├── .eslintrc.js             # ESLint 配置（代码规范）
├── .prettierrc.js           # Prettier 配置（代码格式化）
├── index.html               # 入口 HTML
├── package.json             # 项目依赖、脚本配置
├── vite.config.js           # Vite 配置（打包、代理、别名等）
└── README.md                # 项目说明文档
```