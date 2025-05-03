<template>
  <div class="page-container employee-management">
    <!-- 搜索和操作区域 -->
    <el-card shadow="never" class="action-card">
      <el-form :inline="true" :model="searchParams" @submit.prevent="onSearch">
        <el-form-item label="员工姓名">
          <el-input v-model="searchParams.name" placeholder="请输入员工姓名" clearable @clear="onSearchClear" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :icon="Search">查询</el-button>
        </el-form-item>
        <el-form-item style="float: right;"> <!-- 将按钮移到右侧 -->
          <el-button type="primary" :icon="Plus" @click="goToAddEmployee('add')">添加员工</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="员工姓名" width="180" />
        <el-table-column prop="username" label="账号" width="180" />
        <el-table-column prop="phone" label="手机号" width="180" />
        <el-table-column label="账号状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" disable-transitions>
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后操作时间" prop="updateTime">
           <template #default="scope">{{ formatDateTime(scope.row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              link type="primary" size="small"
              @click="goToAddEmployee(scope.row.id)"
              :disabled="scope.row.username === 'admin'"
              >编辑
            </el-button>
             <!-- 只有 admin 能操作，且不能操作自己 -->
            <el-button
              v-if="isAdmin && scope.row.username !== 'admin'"
              link
              :type="scope.row.status === 1 ? 'danger' : 'success'"
              size="small"
              @click="statusHandle(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
            </el-button>
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
// --- 导入 Element Plus 相关 ---
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import { getEmployeeList, enableOrDisableEmployee } from '@/api/employee';
import { useAdminUserStore } from '@/stores/adminUser';
import { formatDateTime } from '@/utils/format'; // 假设有格式化时间的工具函数

const router = useRouter();
const adminStore = useAdminUserStore();

const searchParams = ref({ name: '' });
const loading = ref(true); // 初始加载状态
const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const isAdmin = computed(() => adminStore.info?.username === 'admin');

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      name: searchParams.value.name || undefined,
    };
    const response = await getEmployeeList(params);
    if (response && response.code === 1) {
      tableData.value = response.data.records || [];
      total.value = response.data.total || 0;
    } else {
      tableData.value = [];
      total.value = 0;
      ElMessage.error(response?.msg || '加载员工列表失败');
    }
  } catch (error) {
     tableData.value = [];
     total.value = 0;
     console.error("加载员工列表异常:", error);
     // ElMessage.error('加载员工列表时出错'); // 错误已在拦截器处理
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
    currentPage.value = 1; // 搜索时回到第一页
    fetchData();
};

const onSearchClear = () => {
    // searchParams.value.name = ''; // input clearable 会自动清空
    onSearch();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1; // 切换每页数量时回到第一页
  fetchData();
};

const handlePageChange = (val) => {
  currentPage.value = val;
  fetchData();
};

const goToAddEmployee = (id) => {
  const path = id === 'add' ? '/employee/add' : `/employee/edit/${id}`;
  router.push(path);
};

// --- 使用 ElMessageBox 替换 showConfirmDialog ---
const statusHandle = async (item) => {
   if (!isAdmin.value || item.username === 'admin') {
       ElMessage.warning('无权操作');
       return;
   }
   const targetStatus = item.status === 0 ? 1 : 0;
   const actionText = targetStatus === 1 ? '启用' : '禁用';

   try {
       await ElMessageBox.confirm(
           `确定${actionText}员工账号 "${item.name}" 吗？`,
           '提示',
           {
               confirmButtonText: '确定',
               cancelButtonText: '取消',
               type: 'warning',
           }
       );
       // 用户点击了确定
       loading.value = true; // 开始loading
       const response = await enableOrDisableEmployee({ id: item.id, status: targetStatus });
       if (response && response.code === 1) {
           ElMessage.success(`账号已${actionText}！`);
           fetchData(); // 刷新列表
       } else {
           ElMessage.error(response?.msg || '状态更新失败');
       }
   } catch (actionOrError) {
       if (actionOrError !== 'cancel') {
           console.error("更新员工状态异常:", actionOrError);
           // ElMessage.error('状态更新请求失败'); // 错误已在拦截器处理
       } else {
           console.log('用户取消操作');
       }
   } finally {
       loading.value = false; // 结束loading
   }
};

onMounted(() => {
    fetchData();
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
  height: 100%;       
  overflow-y: auto;    
  box-sizing: border-box; 
}
.action-card {
  margin-bottom: 20px;
}
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
/* 可以添加一些表格内按钮的间距 */
.el-table .el-button + .el-button {
  margin-left: 8px;
}
</style>