<template>
  <div class="page-container dish-management">
    <!-- 搜索和操作区域 -->
    <el-card shadow="never" class="action-card">
      <el-form :inline="true" :model="searchParams" @submit.prevent="onSearch">
        <el-form-item label="商品名称">
          <el-input v-model="searchParams.name" placeholder="请输入商品名称" clearable @clear="onSearchClear" />
        </el-form-item>
         <el-form-item label="商品分类">
            <el-select v-model="searchParams.categoryId" placeholder="请选择分类" clearable @clear="onSearchClearCategory">
                <el-option
                    v-for="item in categoryList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id" />
             </el-select>
         </el-form-item>
         <el-form-item label="售卖状态">
             <el-select v-model="searchParams.status" placeholder="请选择状态" clearable @clear="onSearchClearStatus">
                <el-option label="启售" :value="1" />
                <el-option label="停售" :value="0" />
             </el-select>
         </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :icon="Search">查询</el-button>
        </el-form-item>
        <el-form-item style="float: right;">
           <el-button type="danger" :icon="Delete" @click="deleteHandle('batch')" :disabled="!multipleSelection.length">批量删除</el-button>
           <el-button type="success" :icon="Top" @click="statusHandle('1')" :disabled="!multipleSelection.length">批量启售</el-button>
           <el-button type="warning" :icon="Bottom" @click="statusHandle('0')" :disabled="!multipleSelection.length">批量停售</el-button>
           <el-button type="primary" :icon="Plus" @click="goToAddDish('add')">新建商品</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="never">
      <el-table
        :data="tableData"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        row-key="id"
        ref="tableRef"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column label="图片" width="100" align="center">
          <template #default="scope">
            <el-image
              style="width: 60px; height: 60px; border-radius: 4px;"
              :src="imgPathConvert(scope.row.image)"
              :preview-src-list="[imgPathConvert(scope.row.image)]"
              fit="cover"
              lazy
              preview-teleported
              hide-on-click-modal
            >
               <template #error>
                 <div class="image-slot">
                   <el-icon><Picture /></el-icon>
                 </div>
               </template>
               <template #placeholder>
                  <div class="image-slot">加载中<span class="dot">...</span></div>
               </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="商品分类" width="150" />
        <el-table-column label="售价" width="120">
            <template #default="scope">￥{{ formatPrice(scope.row.price) }}{{ scope.row.unit ? '/' + scope.row.unit : '' }}</template>
        </el-table-column>
        <el-table-column label="售卖状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" disable-transitions>
              {{ scope.row.status === 1 ? '启售' : '停售' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后操作时间" prop="updateTime" min-width="160">
            <template #default="scope">{{ formatDateTime(scope.row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="goToAddDish(scope.row.id)">修改</el-button>
            <el-button link :type="scope.row.status === 1 ? 'warning' : 'success'" size="small" @click="statusHandle(scope.row)">{{ scope.row.status === 1 ? '停售' : '启售' }}</el-button>
            <el-button link type="danger" size="small" @click="deleteHandle('single', scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="pagination-container"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElTable, ElTableColumn, ElPagination, ElButton, ElCard, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElTag, ElImage, ElIcon } from 'element-plus';
import { Search, Plus, Delete, Top, Bottom, Picture } from '@element-plus/icons-vue';
import { getDishPage, deleteDish, dishStatusByStatus } from '@/api/dish'; // 确认 @ 指向 src 目录
import { getCategoryList } from '@/api/category';       // 确认 @ 指向 src 目录
import { formatDateTime, formatPrice } from '@/utils/format'; // 确认 @ 指向 src 目录

const router = useRouter();

// 查询参数
const searchParams = reactive({ name: '', categoryId: '', status: '' });
// 商品分类列表
const categoryList = ref([]);
// 表格加载状态
const loading = ref(true);
// 表格数据
const tableData = ref([]);
// 当前页码
const currentPage = ref(1);
// 每页显示条数
const pageSize = ref(10);
// 总记录数
const total = ref(0);
// 表格多选选中项
const multipleSelection = ref([]);
// 表格实例引用
const tableRef = ref(null);

/**
 * 获取商品分类列表 (用于下拉框)
 */
const fetchCategories = async () => {
  try {
      const response = await getCategoryList({ type: 1, pageSize: 1000 });
      if (response && response.code === 1) {
          categoryList.value = response.data?.records || response.data || [];
      } else {
          console.warn("获取商品分类失败:", response?.msg);
          ElMessage.warning('获取商品分类列表失败，请稍后重试');
          categoryList.value = [];
      }
  } catch (error) {
      console.error("获取商品分类异常:", error);
      ElMessage.error('加载商品分类时出错');
      categoryList.value = [];
  }
};

/**
 * 获取商品分页数据
 */
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      name: searchParams.name || undefined,
      categoryId: searchParams.categoryId || undefined,
      status: searchParams.status !== '' ? searchParams.status : undefined,
    };

    const response = await getDishPage(params);
    if (response && response.code === 1 && response.data) {
      tableData.value = response.data.records || [];
      total.value = response.data.total || 0;
    } else {
       tableData.value = [];
       total.value = 0;
       if (response && response.code !== 1) {
           ElMessage.error(response?.msg || '加载商品列表失败');
       }
    }
  } catch (error) {
     tableData.value = [];
     total.value = 0;
     console.error("加载商品列表异常:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理表格行选中状态变化
 */
const handleSelectionChange = (val) => {
  multipleSelection.value = val;
};

/**
 * 点击查询按钮
 */
const onSearch = () => {
  currentPage.value = 1;
  fetchData();
};
/**
 * 清空商品名称输入框时触发查询
 */
const onSearchClear = () => {
  onSearch();
};
/**
 * 清空商品分类下拉框时触发查询
 */
const onSearchClearCategory = () => {
  searchParams.categoryId = '';
  onSearch();
};
/**
 * 清空售卖状态下拉框时触发查询
 */
const onSearchClearStatus = () => {
  searchParams.status = '';
  onSearch();
};


/**
 * 处理每页显示条数变化
 */
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchData();
};

/**
 * 处理当前页码变化
 */
const handlePageChange = (val) => {
  currentPage.value = val;
  fetchData();
};

/**
 * 跳转到新增或编辑商品页面
 */
const goToAddDish = (id) => {
  // 假设你的路由路径是 /dish/add 和 /dish/edit/:id
  const path = id === 'add' ? '/dish/add' : `/dish/edit/${id}`;
  router.push(path);
};

/**
 * 图片路径转换 (使用 Vue CLI 的 process.env)
 */
// 读取环境变量 (Vue CLI 方式)
// 确保 .env 或 .env.development 文件中有 VUE_APP_BASE_API=http://your-backend-url
const backendBaseUrl = process.env.VUE_APP_BASE_API;

const imgPathConvert = (path) => {
    if (!path) return ''; // 无路径则返回空

    // 检查环境变量是否已配置
    if (!backendBaseUrl) {
        console.warn('后端 API 基础地址 VUE_APP_BASE_API 未在 .env 文件中配置');
        // 如果配置了代理 (例如 /api)，可以直接返回代理路径
        // 检查你的 vue.config.js 中的 devServer.proxy 设置
        if (process.env.NODE_ENV === 'development') {
             // 仅在开发环境尝试使用代理路径（如果代理存在）
             return `/api/common/download?name=${path}`;
        } else {
            // 生产环境必须配置 VUE_APP_BASE_API，否则返回空或错误提示图
            return ''; // 或者返回一个默认的错误图片路径
        }
    }

    // 拼接基础 URL 和接口路径
    const cleanedBaseUrl = backendBaseUrl.endsWith('/') ? backendBaseUrl.slice(0, -1) : backendBaseUrl;
    // 确认后端下载接口路径为 /common/download
    return `${cleanedBaseUrl}/api/common/download?name=${path}`;
};


/**
 * 删除商品处理 (单个或批量)
 */
const deleteHandle = async (type, id = null) => {
  const idsToDelete = type === 'batch' ? multipleSelection.value.map(item => item.id) : [id];
  if (idsToDelete.length === 0) {
      ElMessage.warning('请先选择要删除的商品');
      return;
  }

  try {
      await ElMessageBox.confirm(`确定删除选中的 ${idsToDelete.length} 个商品吗？删除后可能无法恢复！`, '危险操作确认', {
           confirmButtonText: '确定删除',
           cancelButtonText: '取消',
           type: 'error'
        });

      loading.value = true;
      const response = await deleteDish(idsToDelete.join(','));
      if (response && response.code === 1) {
          ElMessage.success('删除成功！');
          multipleSelection.value = [];
          if (tableRef.value) tableRef.value.clearSelection();
           if(tableData.value.length === idsToDelete.length && currentPage.value > 1){
              currentPage.value -= 1;
           }
          fetchData();
      } else {
          ElMessage.error(response?.msg || '删除失败');
      }
  } catch (actionOrError) {
      if (actionOrError === 'cancel') {
           console.log('用户取消删除');
      } else {
          console.error("删除商品异常:", actionOrError);
      }
  } finally {
     loading.value = false;
   }
};

/**
 * 更新商品售卖状态处理 (单个或批量)
 */
const statusHandle = async (statusOrItem) => {
  const isBatch = typeof statusOrItem === 'string';
  const idsToUpdate = isBatch ? multipleSelection.value.map(item => item.id) : [statusOrItem.id];
  const targetStatus = isBatch ? parseInt(statusOrItem, 10) : (statusOrItem.status === 0 ? 1 : 0);
  const actionText = targetStatus === 1 ? '启售' : '停售';

  if (idsToUpdate.length === 0 && isBatch) {
     ElMessage.warning(`请先选择要批量${actionText}的商品`);
     return;
  }

  try {
      await ElMessageBox.confirm(`确定${actionText}选中的 ${idsToUpdate.length} 个商品吗？`, '确认操作', {
          confirmButtonText: `确定${actionText}`,
          cancelButtonText: '取消',
          type: 'warning'
      });

      loading.value = true;
      // 确认 dishStatusByStatus 接收的参数格式，这里假设是 {ids: '...', status: N}
      const params = { ids: idsToUpdate.join(','), status: targetStatus };
      // 如果 API 设计是 PUT /admin/dish/status/{status}?ids=... 则调用方式不同
      const response = await dishStatusByStatus(params);

      if (response && response.code === 1) {
          ElMessage.success(`商品已${actionText}！`);
          multipleSelection.value = [];
          if (tableRef.value) tableRef.value.clearSelection();
          fetchData();
      } else {
          ElMessage.error(response?.msg || '状态更新失败');
      }
  } catch (actionOrError) {
      if (actionOrError === 'cancel') {
           console.log('用户取消状态更新');
      } else {
           console.error("更新商品状态异常:", actionOrError);
      }
  } finally {
     loading.value = false;
  }
};


// 组件挂载后执行初始化操作
onMounted(() => {
  fetchCategories(); // 先获取分类数据
  fetchData();       // 再获取商品列表数据
});

</script>

<style lang="scss" scoped>
/* 样式保持不变 */
.page-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}
.action-card {
  margin-bottom: 20px;
  .el-form-item {
    margin-bottom: 0;
    margin-right: 10px;
  }
  .el-form-item:last-child {
      margin-right: 0;
  }
}
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.el-table .el-button + .el-button {
  margin-left: 8px;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 14px;
  .el-icon {
    font-size: 20px;
  }
  .dot {
      display: inline-block;
      height: 1em;
      line-height: 1;
      text-align: left;
      vertical-align: -.25em;
      overflow: hidden;
      &::before {
        display: block;
        content: '...\A..\A.';
        white-space: pre-wrap;
        animation: dot 3s infinite step-start both;
      }
  }
}

@keyframes dot {
  33% { transform: translateY(-2em); }
  66% { transform: translateY(-1em); }
}
</style>