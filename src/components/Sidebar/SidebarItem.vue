<template>
  <div v-if="shouldShowItem" class="sidebar-item-wrapper">
    <router-link :to="resolvedPath">
      <el-menu-item :index="resolvedPath" class="sidebar-item">
        <!-- 菜单项标题 -->
        <span>{{ item.meta.title }}</span>
      </el-menu-item>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import path from 'path-browserify';
import { isExternal } from '@/utils/validate';

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
  }
});

// 计算最终渲染的路径
const resolvedPath = computed(() => {
  const routePath = props.item.path;
  if (isExternal(routePath)) {
    return routePath;
  }
  if (isExternal(props.basePath)) {
    return props.basePath;
  }
  return path.resolve(props.basePath, routePath);
});

// 判断此菜单项是否应该显示
const shouldShowItem = computed(() => {
  return props.item.meta && props.item.meta.title && !props.item.meta.hidden;
});
</script>

<style lang="scss">
/* 每个菜单项的容器 */
.sidebar-item-wrapper {
  margin-bottom: 8px;
  padding: 0 10px;
}

/* 菜单项样式 */
.sidebar-item.el-menu-item {
  border-radius: 6px;
  padding-left: 20px !important;
  background-color: transparent !important;
  color: #303133 !important;
  transition: background-color 0.3s ease, color 0.3s ease;
  height: 48px !important;
  line-height: 48px !important;
  font-size: 14px;
  border: none;

  &:hover {
    background-color: #e6f4ea !important;
    color: #2a6a2d !important;
  }

  /* 激活状态 */
  &.is-active {
    background-color: #ffffff !important;
    color: #409eff !important;
    font-weight: 600;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  }

  span {
    vertical-align: middle;
  }

  .el-icon {
    margin-right: 8px;
    vertical-align: middle;
    width: 1em;
    font-size: 16px;
  }
}

a {
  text-decoration: none;
  color: inherit;
}
</style>