// freshveggie-admin-frontend/vue.config.js
const { defineConfig } = require('@vue/cli-service');
const path = require('path');
const webpack = require('webpack');
const AutoImport = require('unplugin-auto-import/webpack').default;
const Components = require('unplugin-vue-components/webpack').default;
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers');

module.exports = defineConfig({
  transpileDependencies: true,

  // 根据环境设置公共路径
  publicPath: process.env.NODE_ENV === 'production' ? '/admin/' : '/',

  // 打包输出目录
  outputDir: 'dist_admin',

  // 自定义 webpack 配置
  configureWebpack: {
    plugins: [
      // 定义全局常量（Vue3 选项式 API 支持等）
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
      }),

      // 自动引入 API（如 ref、reactive 等）和 Element Plus 的方法
      AutoImport({
        resolvers: [ElementPlusResolver()],
        dts: 'src/auto-imports.d.ts', // 生成类型声明文件（建议加上）
        imports: ['vue', 'vue-router', 'pinia'],
        eslintrc: {
          enabled: true, // 自动生成 .eslintrc-auto-import.json
          filepath: './.eslintrc-auto-import.json',
          globalsPropValue: true,
        },
      }),

      // 自动引入组件
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts', // 生成组件类型声明文件
      }),
    ],

    // 路径别名设置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },

  // 本地开发服务器配置
  devServer: {
    port: 8082,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        // pathRewrite 通常不需要设置，除非你后端接口路径不是以 /api 开头
        // pathRewrite: { '^/api': '' }
      },
    },
  },
});
