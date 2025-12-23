const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // Build output directory - to agent-config resources/static (Spring Boot convention)
  outputDir: path.resolve(__dirname, '../agent-config/src/main/resources/static'),
  
  devServer: {
    port: 8080, // 前端开发服务器端口
    proxy: {
      '/dev-api': {
        target: process.env.VUE_APP_API_TARGET || 'http://127.0.0.1:8099', // 从环境变量读取代理目标
        changeOrigin: true,
        pathRewrite: {
          '^/dev-api': '' // 重写路径，去掉 /dev-api 前缀
        }
      }
    }
  }
})
