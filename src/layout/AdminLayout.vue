<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <TheSidebar class="sidebar-container" />

    <!-- 主内容区域 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <TheNavbar />
      <!-- 页面内容占位符 -->
      <div class="app-main">
        <router-view v-slot="{ Component, route }">
          <component :is="Component" :key="route.path" />
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import TheSidebar from '@/components/Sidebar/TheSidebar.vue';
import TheNavbar from '@/components/Navbar/TheNavbar.vue';
import { onMounted } from 'vue';

onMounted(() => {
  console.log('Admin Layout Mounted');
});
</script>

<style lang="scss" scoped>
// @import "@/styles/variables.scss";

.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  background-color: #ffffff;
}

.sidebar-container {
  width: 210px;
  height: 100%;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
  background-color: #d2f4c2;
  box-shadow: 2px 0 6px rgba(0,21,41,.05);
  transition: width 0.28s;
}

.main-container {
  flex: 1;
  min-height: 100%;
  transition: margin-left 0.28s;
  margin-left: 210px;
  position: relative;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.app-main {
  min-height: 0; 
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 15px;
  box-sizing: border-box;
  background-color: #ffffff;
  flex-grow: 1;
  overflow: auto; 
  contain: layout paint; 
}

/* 路由切换动画 (保持之前测试的结果，如果无效就留着，如果有效就注释掉) */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all .5s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.admin-main-content {
  background-color: #f0f2f5; // 主内容区背景色示例
  // padding: 20px; // 移除或注释掉这里的 padding
  height: calc(100vh - 60px); // 仍然计算可用高度
  // overflow-y: auto; // 确保这一行被移除或注释掉，让子组件处理滚动
  box-sizing: border-box;
  // overflow: hidden; // 可以视情况添加，如果子组件高度100%行为不符合预期时尝试
}
</style>