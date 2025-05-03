<template>
  <div class="admin-app-wrapper">
    <!-- 侧边栏 -->
    <div class="sidebar-container">
      <div class="logo">
        <img src="@/assets/images/login-logo.png" alt="Logo" />
      </div>
      <van-sidebar v-model="activeMenu" @change="onMenuChange" class="admin-sidebar">
        <van-sidebar-item
          v-for="item in menuList"
          :key="item.id"
          :title="item.name"
          :name="item.name"
        />
         <!-- 这里可以使用 Vant Sidebar 来实现，也可以用 NavMenu -->
         <!-- Vant Sidebar 更适合简单场景，如果层级复杂或样式要求高，可能需要自定义或换 Element Plus NavMenu -->
      </van-sidebar>
    </div>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <div class="navbar">
         <!-- <div class="head-lable"> -->
           <!-- 导航标题或面包屑，可以根据当前路由动态生成 -->
           <!-- <span>{{ currentRouteTitle }}</span> -->
         <!-- </div> -->
        <div class="right-menu">
          <div class="avatar-wrapper">欢迎, {{ adminStore.adminName }}</div>
          <img src="@/assets/images/logout.png" class="outLogin" alt="退出" @click="logout" title="退出登录" />
        </div>
      </div>

      <!-- 页面内容路由视图 -->
      <div class="app-main">
        <router-view v-slot="{ Component }">
           <transition name="fade-transform" mode="out-in">
             <component :is="Component" />
           </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminUserStore } from '@/stores/adminUser';
import { showConfirmDialog } from 'vant';
import loginApi from '@/api/login'; // 假设你的登录 API 文件有默认导出

const router = useRouter();
const route = useRoute();
const adminStore = useAdminUserStore();

// --- 菜单数据 ---
// 直接在 setup 中定义，或者从后端获取，或者放在单独的文件中
const menuList = ref([
  { id: 'dashboard', name: '仪表盘', path: '/dashboard', icon: 'wap-home-o' }, // 添加仪表盘
  { id: 'employee', name: '员工管理', path: '/employee', icon: 'friends-o' },
  { id: 'category', name: '分类管理', path: '/category', icon: 'coupon-o' },
  { id: 'dish', name: '商品管理', path: '/dish', icon: 'goods-collect-o' },
  { id: 'setmeal', name: '套餐管理', path: '/setmeal', icon: 'cluster-o' },
  { id: 'order', name: '订单明细', path: '/order', icon: 'orders-o' },
]);

// 当前激活的菜单项（尝试与路由匹配）
const activeMenu = ref(getMenuNameFromRoute());

// 从当前路由获取应激活的菜单项名称
function getMenuNameFromRoute() {
  const matchedRoute = menuList.value.find(item => route.path.startsWith(item.path));
  return matchedRoute ? matchedRoute.name : menuList.value[0]?.name; // 默认激活第一个
}

// 监听路由变化以更新激活菜单
watch(route, () => {
  activeMenu.value = getMenuNameFromRoute();
});

// 菜单切换处理 (Vant Sidebar @change 回调接收的是 index 或 name)
const onMenuChange = (indexOrName) => {
   const selectedMenuItem = menuList.value.find(item => item.name === indexOrName || item.id === indexOrName);
   if (selectedMenuItem && selectedMenuItem.path) {
       router.push(selectedMenuItem.path);
   }
};

// 退出登录逻辑
const logout = async () => {
  try {
    await showConfirmDialog({ title: '提示', message: '确定退出登录吗？' });
    await adminStore.logout(); // 调用 store 中的 logout 方法 (它内部应该处理 API 调用和清理本地存储)
    router.push('/login'); // 跳转到登录页
  } catch (error) {
    // 用户取消或登出失败（Store 中应有日志记录）
     if (error && error.message !== 'cancel') {
          console.error('Admin Logout failed:', error);
     }
  }
};

// 可选：获取当前路由的标题（如果 meta.title 有定义）
const currentRouteTitle = computed(() => {
    return route.meta.title || '管理后台';
});

</script>

<style scoped>
.admin-app-wrapper {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #ffffff;
}

/* --- 侧边栏 --- */
.sidebar-container {
  width: 190px; /* 固定宽度 */
  height: 100%;
  background-color: #e1eedc; /* 更柔和的绿色调 */
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
  flex-shrink: 0; /* 防止被压缩 */
  display: flex;
  flex-direction: column;
}

.sidebar-container .logo {
  padding: 15px 0;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0; /* 不压缩 */
}

.sidebar-container .logo img {
  width: 130px;
  height: auto;
}

.admin-sidebar {
  width: 100% !important; /* Vant Sidebar 宽度占满 */
  flex-grow: 1; /* 占据剩余高度 */
  background-color: transparent !important; /* 使其融入容器背景 */
}

/* Vant Sidebar 样式覆盖 */
:deep(.van-sidebar-item) {
  padding: 15px 18px;
  color: #444; /* 调整默认文字颜色 */
  font-size: 14px;
  background-color: transparent;
}

:deep(.van-sidebar-item--select) {
  color: #388e3c; /* Vant 绿色 */
  background-color: #ffffff; /* 选中背景白色 */
  font-weight: 500;
}
:deep(.van-sidebar-item--select::before) {
  background-color: #4CAF50; /* Vant 绿色指示器 */
  height: 50%;
  top: 25%;
  width: 3px;
}

/* --- 主内容区 --- */
.main-container {
  flex-grow: 1;
  height: 100vh;
  overflow-y: auto; /* 内容区可滚动 */
  display: flex;
  flex-direction: column;
}

/* --- 顶部导航栏 --- */
.navbar {
  height: 50px; /* 减少高度 */
  line-height: 50px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0; /* 更浅的分隔线 */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end; /* 主要内容靠右 */
  align-items: center;
  padding: 0 20px; /* 左右内边距 */
  flex-shrink: 0; /* 不压缩 */
}
.navbar .right-menu {
  display: flex;
  align-items: center;
}
.navbar .avatar-wrapper {
  color: #333;
  font-size: 14px;
  margin-right: 15px;
}
.navbar .outLogin {
  width: 20px;
  height: 20px;
  cursor: pointer;
  vertical-align: middle;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.navbar .outLogin:hover {
  opacity: 1;
}


/* --- 页面内容区域 --- */
.app-main {
  flex-grow: 1;
  padding: 15px; /* 给页面内容一些边距 */
  box-sizing: border-box;
  overflow-y: auto; /* 内容溢出时允许滚动 */
}

/* --- 路由切换过渡动画 (可选) --- */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all .3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>