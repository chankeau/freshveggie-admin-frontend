<template>
  <!-- App.vue 的主要职责是渲染当前路由匹配的组件 -->
  <!-- 如果是登录页，就渲染登录页组件 -->
  <!-- 如果是后台页面，路由会配置为先渲染 AdminLayout，再在 Layout 内部渲染具体页面 -->
  <router-view />
</template>

<script setup>
// 通常 App.vue 不需要太多逻辑，除非处理非常全局的状态或事件
import { onMounted } from 'vue';
onMounted(() => {
  console.log('Admin App Root Mounted'); // 可以保留用于调试
});
</script>

<style>
/* 全局 Reset 和基础样式，适用于后台管理系统 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden; /* 防止 body 出现滚动条，让布局内部处理滚动 */
}

body {
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif; /* 常见的后台字体栈 */
  font-size: 14px; /* 桌面端常用基础字号 */
  line-height: 1.5;
  color: #333; /* 默认文字颜色 */
  background-color: #f0f2f5; /* 后台系统常用背景色 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* #app 是 Vue 应用挂载的根元素 */
#app {
   height: 100%;
   width: 100%;
}

/* 可以保留一些基础 reset */
*, *::before, *::after {
  box-sizing: border-box;
}

a {
  text-decoration: none;
  color: inherit;
}

img {
  max-width: 100%;
  height: auto;
  vertical-align: middle;
}

/* 清除浮动 (如果项目中有用到 float) */
.clearfix::after {
    content: "";
    display: table;
    clear: both;
}

/* Vant 的样式应该在 main.js 中全局引入一次即可，这里可以注释掉或删除，
   除非你有特殊理由需要在这里再次引入。重复引入可能增大打包体积。*/
/* @import 'vant/lib/index.css'; */

/* 可以在这里添加后台系统常用的全局辅助类，例如： */
/* .text-center { text-align: center; } */
/* .mt-10 { margin-top: 10px; } */

</style>