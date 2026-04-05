import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons' // 可选，svg图标支持

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // svg图标插件（可选，需安装：npm install vite-plugin-svg-icons -D）
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[dir]-[name]'
    })
  ],
  // 路径别名（简化导入）
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '~': path.resolve(__dirname, 'public')
    }
  },
  // 开发服务器配置（代理、端口）
  server: {
    port: 5173, // 开发端口
    open: true, // 启动自动打开浏览器
    proxy: {
      // 接口代理，解决跨域
      '/api': {
        target: 'https://webvue.pages.dev', // 测试环境接口地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  // 打包配置（企业级优化）
  build: {
    outDir: 'dist', // 打包输出目录
    assetsDir: 'static', // 静态资源目录
    minify: 'terser', // 压缩方式
    terserOptions: {
      compress: {
        drop_console: true, // 打包删除console
        drop_debugger: true // 打包删除debugger
      }
    },
    rollupOptions: {
      // 打包拆分（优化加载速度）
      output: {
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
      }
    }
  },
  // 样式配置（支持scss）
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/variables.scss";` // 全局scss变量
      }
    }
  }
})