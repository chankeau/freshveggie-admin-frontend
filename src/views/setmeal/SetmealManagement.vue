<template>
  <div class="page-container setmeal-management">
    <!-- 操作栏 -->
    <div class="action-bar">
       <el-input
         v-model="searchParams.name"
         placeholder="请输入套餐名称"
         clearable
         @clear="onSearch"
         @keyup.enter="onSearch"
         class="search-input"
         style="width: 250px;"
       >
         <template #append>
           <el-button :icon="Search" @click="onSearch" />
         </template>
       </el-input>
       <div class="action-buttons">
                                         
         <el-button type="danger" size="default" @click="deleteHandle('batch')" :disabled="!selectedSetmeals.length" plain>批量删除</el-button>
                                          
         <el-button type="success" size="default" @click="statusHandle(1, 'batch')" :disabled="!selectedSetmeals.length" plain>批量启售</el-button>
                                          
         <el-button type="warning" size="default" @click="statusHandle(0, 'batch')" :disabled="!selectedSetmeals.length" plain>批量停售</el-button>
                                             
         <el-button type="primary" :icon="Plus" @click="goToAddSetmeal('add')">新建套餐</el-button>
       </div>
     </div>

    <!-- 数据表格: 添加 v-if="tableVisible" -->
    <el-table
      v-if="tableVisible"
      :data="tableData"
      :key="tableKey" 
      @selection-change="handleSelectionChange" 
      style="width: 100%"
      stripe
      border
      class="data-table"
      ref="tableRef"
    >
      <!-- 列定义 (使用完整的列定义) -->
       <el-table-column type="selection" width="55" align="center" />
       <el-table-column prop="name" label="套餐名称" min-width="180" show-overflow-tooltip />
       <el-table-column label="图片" width="100" align="center">
         <template #default="scope">
           <el-image
             style="width: 50px; height: 50px; border-radius: 4px;"
             :src="imgPathConvert(scope.row.image)"
             :preview-src-list="scope.row.image ? [imgPathConvert(scope.row.image)] : []"
             fit="cover"
             lazy
             preview-teleported
             hide-on-click-modal
           >
             <template #error>
               <div class="image-slot">暂无图片</div>
             </template>
           </el-image>
         </template>
       </el-table-column>
       <el-table-column prop="categoryName" label="套餐分类" width="120" />
       <el-table-column prop="price" label="价格" width="100" align="right">
           <template #default="scope">
             <span>￥{{ formatPrice(scope.row.price) }}</span>
           </template>
       </el-table-column>
       <el-table-column label="售卖状态" width="100" align="center">
         <template #default="scope">
           <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
             {{ scope.row.status === 1 ? '启售' : '停售' }}
           </el-tag>
         </template>
       </el-table-column>
       <el-table-column prop="updateTime" label="最后操作时间" width="180" :formatter="formatDateTimeCell" />
       <el-table-column label="操作" width="220" align="center">
         <template #default="scope">
                                         <!-- 调用 goToAddSetmeal -->
           <el-button link type="primary" size="small" @click="goToAddSetmeal(scope.row.id)">修改</el-button>
                                            <!-- 调用 statusHandle -->
           <el-button
             link
             :type="scope.row.status === 0 ? 'success' : 'warning'"
             size="small"
             @click="statusHandle(scope.row.status === 0 ? 1 : 0, 'single', scope.row.id)"
           >
             {{ scope.row.status === 0 ? '启售' : '停售' }}
           </el-button>
                                             <!-- 调用 deleteHandle -->
           <el-button link type="danger" size="small" @click="deleteHandle('single', scope.row.id)">删除</el-button>
         </template>
       </el-table-column>
        <template #empty>
            <el-empty description="暂无套餐数据" />
        </template>
    </el-table>
    <!-- 在表格不可见时显示加载提示 -->
     <div v-else class="initial-loading" v-loading="loading">
        <!-- 保留 v-loading 的默认效果 -->
     </div>


    <!-- 分页器 -->
    <el-pagination
      v-if="total > 0 && tableVisible" 
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 30, 50]"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination-container"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getSetmealPage, deleteSetmeal, setmealStatusByStatus } from '@/api/setmeal';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';

const router = useRouter(); 

const tableVisible = ref(false);
const tableKey = ref(0);
const searchParams = ref({ name: '' });
const loading = ref(true); 
const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const selectedSetmeals = ref([]); 

const imgPathConvert = (path) => {
  if (!path) return '';
  const baseUrl = '/api';
  return `${baseUrl}/common/download?name=${encodeURIComponent(path)}`;
};

const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
};

const formatDateTimeCell = (row, column, cellValue) => {
    if (!cellValue) return '-';
    try {
        const date = new Date(cellValue);
        if (isNaN(date.getTime())) return cellValue;
        return date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    } catch (e) { return cellValue; }
};

// 定义 fetchData (使用了 getSetmealPage, ElNotification)
const fetchData = async () => {
  loading.value = true; // 控制加载状态
  try {
    const params = {
        page: currentPage.value,
        pageSize: pageSize.value,
        name: searchParams.value.name || undefined,
     };
    const response = await getSetmealPage(params);
     if (response && response.code === 1 && response.data) {
        tableData.value = response.data.records || [];
        total.value = response.data.total || 0;
     } else {
        tableData.value = [];
        total.value = 0;
        ElNotification({ type: 'error', title: '错误', message: response?.msg || '加载套餐列表失败' });
     }
  } catch (error) {
     tableData.value = [];
     total.value = 0;
     console.error("加载套餐列表异常:", error);
     ElNotification({ type: 'error', title: '错误', message: '请求套餐列表时发生错误' });
  } finally {
     loading.value = false; 
     tableKey.value += 1; 
      if (!tableVisible.value) {
          nextTick(() => {
              tableVisible.value = true;
          });
      }
  }
};

// 定义 onSearch (使用了 fetchData)
const onSearch = () => {
    currentPage.value = 1;
    fetchData();
};

// 定义 handleSizeChange (使用了 fetchData)
const handleSizeChange = (newSize) => {
    pageSize.value = newSize;
    currentPage.value = 1;
    fetchData();
};

// 定义 handleCurrentChange (使用了 fetchData)
const handleCurrentChange = (newPage) => {
    currentPage.value = newPage;
    fetchData();
};

// 定义 handleSelectionChange (修改了 selectedSetmeals)
const handleSelectionChange = (selection) => {
  selectedSetmeals.value = selection.map(item => item.id);
};

// 定义 goToAddSetmeal (使用了 router)
const goToAddSetmeal = (id) => {
  const path = id === 'add' ? '/setmeal/add' : `/setmeal/edit/${id}`;
  router.push(path);
};

// 定义 deleteHandle (使用了 ElMessage, ElMessageBox, deleteSetmeal, fetchData)
const deleteHandle = (type, id = null) => {
  const idsToDelete = type === 'batch' ? selectedSetmeals.value : [id];
  if (idsToDelete.length === 0) {
    ElMessage.warning('请先选择要删除的套餐'); // 使用 ElMessage
    return;
  }
  ElMessageBox.confirm(`确定删除选中的 ${idsToDelete.length} 个套餐吗？`, '提示', { // 使用 ElMessageBox
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
      try {
        const response = await deleteSetmeal(idsToDelete.join(',')); // 使用 deleteSetmeal
         if (response && response.code === 1) {
           ElMessage.success('删除成功！'); // 使用 ElMessage
           if (tableData.value.length === idsToDelete.length && currentPage.value > 1) { currentPage.value -= 1; }
           fetchData(); // 使用 fetchData
         } else {
           ElNotification({ type: 'error', title:'失败', message: response?.msg || '删除失败' }); // 使用 ElNotification
         }
      } catch (error) {
         console.error("删除套餐异常:", error);
         ElNotification({ type: 'error', title: '错误', message: '删除请求失败' }); // 使用 ElNotification
      }
    }).catch(() => {});
};

// 定义 statusHandle (使用了 ElMessage, ElMessageBox, setmealStatusByStatus, fetchData)
const statusHandle = (targetStatus, type, id = null) => {
  const idsToUpdate = type === 'batch' ? selectedSetmeals.value : [id];
  // --- 修正处 ---
  const actionText = targetStatus === 1 ? '启售' : '停售';

  if (type === 'batch' && idsToUpdate.length === 0) {
     ElMessage.warning(`请先选择要批量${actionText}的套餐`); // 使用 ElMessage
     return;
   }
  ElMessageBox.confirm(`确定${actionText}选中的 ${idsToUpdate.length} 个套餐吗？`, '确认操作', { // 使用 ElMessageBox
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  }).then(async () => {
      try {
        const params = {
            ids: idsToUpdate.join(','),
            status: targetStatus
        };
        const response = await setmealStatusByStatus(params); // 使用 setmealStatusByStatus
        if (response && response.code === 1) {
          ElMessage.success(`套餐已${actionText}！`); // 使用 ElMessage
          fetchData(); // 使用 fetchData
        } else {
          ElNotification({ type: 'error', title: '失败', message: response?.msg || `状态更新失败` }); // 使用 ElNotification
        }
      } catch (error) {
         console.error(`更新套餐状态异常 (${actionText}):`, error);
         ElNotification({ type: 'error', title: '错误', message: `状态更新请求失败` }); // 使用 ElNotification
       }
    }).catch(() => {});
};

// 定义 onMounted (使用了 fetchData)
onMounted(() => {
  tableVisible.value = false;
  fetchData(); // 使用 fetchData
});

</script>

<style lang="scss" scoped>

.page-container {
  padding: 20px;
  height: 100%;       
  overflow-y: auto;    
  box-sizing: border-box; 
  background-color: #ffffff;
}
.action-bar {
  background-color: #fff;
  padding: 15px 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.search-input {
  flex-grow: 1;
  min-width: 200px;
  max-width: 300px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.data-table {
  margin-bottom: 20px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ebeef5;
   :deep(th.el-table__cell) {
       background-color: #fafafa;
       color: #333;
       font-weight: 500;
   }
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-lighter);
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.initial-loading {
  padding: 30px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
   :deep(.el-loading-mask) {
      background-color: rgba(255, 255, 255, 0.8);
   }
   min-height: 200px;
   display: flex;
   align-items: center;
   justify-content: center;
}


.pagination-container {
  display: flex;
  justify-content: flex-end;
  background-color: #fff;
  padding: 15px 20px;
  border-radius: 4px;
  margin-top: 20px;
}

.el-button--small {
    padding: 8px 10px;
}
.el-button [class*=el-icon]+span {
    margin-left: 5px;
}

.el-button.is-link {

}

</style>