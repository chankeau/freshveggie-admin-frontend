<template>
  <div class="sidebar-container-inner">
    <div class="logo">
      <router-link to="/">
        <img src="@/assets/images/login/login-logo.png" alt="蔬鲜递后台 Logo" />
      </router-link>
    </div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical-custom"
        :collapse="isCollapse"
        :unique-opened="false"
        :collapse-transition="false"
        mode="vertical"
        router
      >
        <sidebar-item
          v-for="routeItem in menuRoutes"
          :key="routeItem.path"
          :item="routeItem"
          :base-path="resolveBasePath(routeItem)"
          :is-collapse="isCollapse"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed, ref, markRaw, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import path from 'path-browserify';
import SidebarItem from './SidebarItem.vue';

const route = useRoute();
const router = useRouter();
const isCollapse = ref(false);

const menuRoutes = computed(() => {
  const layoutRoute = router.options.routes.find(r => r.path === '/' && r.children);
  if (!layoutRoute) return [];

  const generateMenu = (routes, basePath = '') => {
    return routes
      .filter(item => item.meta?.title && !item.meta?.hidden)
      .map(item => {
        const fullPath = path.resolve(basePath, item.path);
        let iconComponent = null;

        if (item.meta?.icon) {
          if (typeof item.meta.icon === 'object' && item.meta.icon.render) {
            iconComponent = markRaw(item.meta.icon);
          } else {
            iconComponent = markRaw(item.meta.icon);
          }
        }

        const menuItem = {
          path: fullPath,
          name: item.meta.title,
          iconComponent: iconComponent,
          meta: item.meta
        };

        if (item.children && item.children.length > 0) {
          menuItem.children = generateMenu(item.children, fullPath);
        }

        return menuItem;
      });
  };

  return generateMenu(layoutRoute.children, layoutRoute.path);
});

const activeMenu = computed(() => {
  const { meta, path } = route;
  return meta?.activeMenu || path;
});

const resolveBasePath = (routeItem) => {
  if (routeItem.path.includes('/')) {
    return routeItem.path.substring(0, routeItem.path.lastIndexOf('/')) || '/';
  }
  return '/';
};

onMounted(() => {
  // console.log('Sidebar mounted');
});

watch(route, () => {
  // console.log('Route changed');
});
</script>

<style lang="scss" scoped>
$sidebarBgColor: #ffffff;
$menuItemTextColor: #333;
$menuItemActiveTextColor: #4CAF50;
$menuItemActiveBgColor: #e8f5e9;
$menuItemHoverBgColor: #f0f7f1;
$activeBorderColor: #4CAF50;
$iconDefaultColor: #7f8c8d;
$iconActiveColor: $menuItemActiveTextColor;

.sidebar-container-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: $sidebarBgColor;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  background-color: #d2f4c2;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;

  img {
    max-height: 36px;
    max-width: 85%;
  }
}

.el-scrollbar {
  flex-grow: 1;
  height: calc(100% - 60px);
}

.scrollbar-wrapper {
  overflow-x: hidden !important;
}

.el-menu-vertical-custom {
  border-right: none;
  width: 100% !important;
  background-color: #d2f4c2 !important;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 50px;
    line-height: 50px;
    color: $menuItemTextColor;
    background-color: transparent !important;
    padding-left: 20px !important;
    border-left: 4px solid transparent;
    transition: all 0.2s ease-in-out;
    border-radius: 0 25px 25px 0;

    &:hover {
      background-color: $menuItemHoverBgColor !important;
    }

    .el-icon,
    i.el-icon {
      margin-right: 12px;
      font-size: 16px;
      color: $iconDefaultColor;
    }
  }

  :deep(.el-menu-item.is-active) {
    background-color: $menuItemActiveBgColor !important;
    color: $menuItemActiveTextColor !important;
    font-weight: 500;
    border-left-color: $activeBorderColor;

    .el-icon,
    i.el-icon {
      color: $iconActiveColor;
    }
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: $menuItemTextColor;
  }

  :deep(.el-menu--inline) {
    background-color: lighten($sidebarBgColor, 2%) !important;

    .el-menu-item {
      padding-left: 40px !important;
    }
  }
}
</style>
