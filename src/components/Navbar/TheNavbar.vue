<template>
  <div class="navbar">
    <!-- 左侧区域: 显示页面标题 -->
    <div class="left-menu">
      <span class="page-title">{{ currentPageTitle }}</span>
    </div>

    <!-- 右侧区域: 用户信息与操作 -->
    <div class="right-menu">
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <el-avatar :size="30" :src="avatarUrl" class="user-avatar">
            {{ adminName ? adminName.charAt(0) : '管' }}
          </el-avatar>
          <span class="user-name">{{ adminName }}</span>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/">
              <el-dropdown-item>首页</el-dropdown-item>
            </router-link>
            <el-dropdown-item divided @click="logout">
              <span style="display: block;">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminUserStore } from '@/stores/adminUser';
import { ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';

const route = useRoute();
const adminStore = useAdminUserStore();

// 当前页面标题
const currentPageTitle = computed(() => {
  return route.meta?.title || '管理后台';
});

// 管理员名称
const adminName = computed(() => adminStore.adminName || '管理员');

// 头像 URL
const avatarUrl = computed(() => {
    return ''; // 实际应从 store 获取
});

// 退出登录方法
const logout = async () => {
  try {
    await ElMessageBox.confirm('您确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await adminStore.logout();
  } catch (action) {
    if (action === 'cancel') {
        console.log('用户取消了退出操作');
    }
  }
};
</script>

<style lang="scss" scoped>
.navbar {
  height: 54px;
  background: #fff;
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-radius: 6px 6px 0 0;
  z-index: 1002;
}

.left-menu .page-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.right-menu {
  display: flex;
  align-items: center;
  gap: 12px;

  .avatar-container {
    .avatar-wrapper {
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease-in-out;

      &:hover {
        transform: scale(1.02);
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        font-size: 14px;
        margin-right: 8px;
        background-color: #e0e6ed;
        color: #409eff;
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .user-name {
        font-size: 14px;
        color: #606266;
        margin-right: 4px;
        max-width: 100px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .el-icon--right {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

// 调整下拉菜单链接样式
:deep(.el-dropdown-menu__item) {
  a {
    text-decoration: none;
    color: inherit;
    display: block;
  }

  &:hover {
    background-color: #f5f7fa;
    color: #409eff;
  }

  span[style*="display:block"] {
    display: inline !important;
  }
}
</style>
