<template>
  <div class="page-container order-management">
    <!-- 搜索栏: 使用 el-form 和 el-input / el-date-picker -->
    <el-form :inline="true" :model="searchParams" class="search-bar" @submit.prevent="onSearch">
      <el-form-item label="订单号">
        <el-input
          v-model="searchParams.number"
          placeholder="请输入订单号"
          clearable
          @clear="onSearchClearNumber"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="下单时间">
        <!-- 使用 ElDatePicker 的 daterange 类型 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="onDateChange"
          value-format="YYYY-MM-DD"
          :clearable="true"
          @clear="onSearchClearDate"
          style="width: 240px;"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch" :icon="Search">查询</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格: 使用 el-table -->
    <el-table :data="tableData" v-loading="loading || initialLoading" style="width: 100%" border stripe>
      <el-table-column prop="number" label="订单号" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <el-link type="primary" @click="showOrderDetail(row)">{{ row.number }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="orderStatusType(row.status)">{{ getOrderTypeText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="userName" label="用户" width="120">
         <template #default="{ row }"> {{ row.userName || row.consignee || '-' }} </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column prop="orderTime" label="下单时间" width="170">
         <template #default="{ row }"> {{ formatDateTime(row.orderTime) }} </template>
      </el-table-column>
      <el-table-column prop="amount" label="实收金额" width="100" align="right">
          <template #default="{ row }"> ￥{{ formatPrice(row.amount) }} </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showOrderDetail(row)">查看</el-button>
          <el-button v-if="row.status === 2" type="success" link size="small" @click="handleOrderAction(3, row.id)">派送</el-button>
          <el-button v-if="row.status === 3" type="warning" link size="small" @click="handleOrderAction(4, row.id)">完成</el-button>
        </template>
      </el-table-column>
       <template #empty>
          <el-empty description="暂无订单数据" />
       </template>
    </el-table>

     <!-- 分页: 使用 el-pagination -->
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

     <!-- 订单详情弹窗: 使用 el-dialog 和 el-descriptions -->
     <el-dialog v-model="detailDialogVisible" title="订单详情" width="600px">
       <el-descriptions :column="1" border>
         <el-descriptions-item label="订单号">{{ currentOrderDetail.number }}</el-descriptions-item>
         <el-descriptions-item label="订单状态">
           <el-tag :type="orderStatusType(currentOrderDetail.status)">{{ getOrderTypeText(currentOrderDetail.status) }}</el-tag>
         </el-descriptions-item>
         <el-descriptions-item label="收货人">{{ currentOrderDetail.consignee }}</el-descriptions-item>
         <el-descriptions-item label="联系电话">{{ currentOrderDetail.phone }}</el-descriptions-item>
         <el-descriptions-item label="收货地址">{{ currentOrderDetail.address }}</el-descriptions-item>
         <el-descriptions-item label="下单时间">{{ formatDateTime(currentOrderDetail.orderTime) }}</el-descriptions-item>
         <el-descriptions-item label="支付金额">￥{{ formatPrice(currentOrderDetail.amount) }}</el-descriptions-item>
         <el-descriptions-item label="备注">{{ currentOrderDetail.remark || '无' }}</el-descriptions-item>
         <!-- 这里可以添加一个 el-table 来显示订单明细 -->
       </el-descriptions>
       <template #footer>
         <span class="dialog-footer">
           <el-button @click="detailDialogVisible = false">关闭</el-button>
         </span>
       </template>
     </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// *** 引入 Element Plus 相关 ***
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue'; // 引入图标

// *** 移除 Vant 相关 ***
// import { showConfirmDialog, showNotify, showToast } from 'vant';

// 引入 API
import { getOrderPage, updateOrderStatus } from '@/api/order';

// --- 状态定义 (基本不变，移除 Vant 特有的) ---
const searchParams = ref({ number: '', beginTime: '', endTime: '' });
const loading = ref(false);
// const finished = ref(true); // Element Pagination 不需要这个
const initialLoading = ref(true);
const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// const showCalendar = ref(false); // 不再需要 van-calendar 的状态
const dateRange = ref([]); // 用于 el-date-picker
// const minDate = new Date(2023, 0, 1); // el-date-picker 可以通过 :disabled-date 设置
// const maxDate = new Date();

const detailDialogVisible = ref(false); // el-dialog 的状态
const currentOrderDetail = ref({});

// --- 工具函数 (基本不变) ---
// formatDate 不再直接用于显示，el-date-picker 的 value-format 控制格式
// const formatDate = (date) => { ... };
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return dateTimeStr;
        return date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    } catch (e) { return dateTimeStr; }
};
const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
};

// --- 数据获取 (基本不变，错误处理用 ElMessage) ---
const fetchData = async (pageToFetch = currentPage.value) => {
  if(pageToFetch === 1) initialLoading.value = true;
  loading.value = true;
  try {
    const params = {
      page: pageToFetch,
      pageSize: pageSize.value,
      number: searchParams.value.number || undefined,
      beginTime: searchParams.value.beginTime || undefined,
      endTime: searchParams.value.endTime || undefined,
    };
    const response = await getOrderPage(params); // API 调用返回的是 R 对象
    if (response && response.code === 1 && response.data) {
      // 注意：response.data 是 R.data，里面才是分页对象 { records, total }
      tableData.value = response.data.records || [];
      total.value = response.data.total || 0;
      // currentPage.value 会通过 v-model 自动更新
    } else {
       tableData.value = [];
       total.value = 0;
       // *** 使用 ElMessage 提示 ***
       ElMessage.error(response?.msg || '加载订单列表失败');
    }
  } catch (error) {
      tableData.value = [];
      total.value = 0;
      console.error("加载订单列表异常:", error);
      // *** 使用 ElMessage 提示 ***
      ElMessage.error('加载订单列表时发生错误');
  } finally {
    loading.value = false;
    initialLoading.value = false;
    // finished.value = true; // 不需要了
  }
};

// const onLoad = () => {}; // 不再需要

// --- 搜索和日期处理 ---
const onSearch = () => {
    currentPage.value = 1;
    fetchData();
};
const onSearchClearNumber = () => {
    searchParams.value.number = '';
    onSearch();
};
const onDateChange = (newDates) => {
    if (newDates && newDates.length === 2) {
        // el-date-picker v-model 绑定的是数组 ['YYYY-MM-DD', 'YYYY-MM-DD']
        searchParams.value.beginTime = newDates[0] + ' 00:00:00';
        searchParams.value.endTime = newDates[1] + ' 23:59:59';
    } else {
        searchParams.value.beginTime = '';
        searchParams.value.endTime = '';
    }
     onSearch(); // 日期改变或清空后重新搜索
};
const onSearchClearDate = () => {
    dateRange.value = []; // 清空 el-date-picker 的 v-model
    // onDateChange(null) 会自动触发搜索
};

// --- 分页处理 ---
const handleSizeChange = (newSize) => {
    pageSize.value = newSize;
    currentPage.value = 1; // 页码大小改变，回到第一页
    fetchData();
};
const handlePageChange = (page) => {
    fetchData(page);
};

// --- 订单状态和详情 (基本不变) ---
const getOrderTypeText = (status) => { /* ... 保持不变 ... */
  const statusMap = { 1: '待付款', 2: '待派送', 3: '已派送', 4: '已完成', 5: '已取消' };
  return statusMap[status] || '未知状态';
};
const orderStatusType = (status) => { /* ... 保持不变 ... */
  // Element Plus Tag 的 type: success / info / warning / danger
  const typeMap = { 1: 'warning', 2: 'primary', 3: 'primary', 4: 'success', 5: 'danger' };
  return typeMap[status] || ''; // 默认为空或 'info'
};
const showOrderDetail = (row) => { /* ... 保持不变 ... */
  currentOrderDetail.value = { ...row };
  detailDialogVisible.value = true;
};

// --- 订单操作 (使用 ElMessageBox) ---
const handleOrderAction = (status, id) => {
   const actionText = status === 3 ? '派送' : status === 4 ? '完成' : '操作';
   // *** 使用 ElMessageBox ***
   ElMessageBox.confirm(`确认将此订单标记为 "${actionText}" 吗？`, '提示', {
       confirmButtonText: '确定',
       cancelButtonText: '取消',
       type: 'warning',
     })
     .then(async () => {
       try {
         const params = { id, status };
         const response = await updateOrderStatus(params);
         if (response && response.code === 1) {
           // *** 使用 ElMessage ***
           ElMessage.success(`订单已${actionText}`);
           fetchData(currentPage.value); // 刷新当前页
         } else {
           // *** 使用 ElMessage ***
           ElMessage.error(response?.msg || '操作失败');
         }
       } catch (error) {
         console.error("更新订单状态异常:", error);
          // *** 使用 ElMessage ***
          ElMessage.error('更新订单状态请求失败');
       }
     })
     .catch(() => {
       // 用户点击取消
       ElMessage.info('已取消操作');
     });
};

// --- 组件挂载 ---
onMounted(() => {
    fetchData(); // 加载第一页数据
});
</script>

<style scoped lang="scss">
.page-container {
  padding: 15px;
  height: 100%;       
  overflow-y: auto;    
  box-sizing: border-box; 
}
.search-bar {
  margin-bottom: 15px;
  padding: 10px 15px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
   .el-form-item {
     margin-bottom: 0; // 行内表单项不需要底部外边距
   }
}
.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end; // 页码靠右
}
// 你可能需要添加更多样式来调整 Element Plus 组件的布局和外观
.order-number .el-link {
  font-weight: bold;
}
.address-col {
   white-space: nowrap;
   overflow: hidden;
   text-overflow: ellipsis;
}
.page-container { padding: 15px; background-color: #ffffff; }
.action-bar { background-color: #fff; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.search-input { flex: 1; min-width: 200px; max-width: 250px;}
.date-range-input { flex: 1; min-width: 240px; max-width: 350px; border: 1px solid #dcdee0; border-radius: 99px; padding: 0 10px;}
.search-btn { margin-left: auto; }

.data-list { border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.data-table-header .table-header-row, .data-table-body .table-data-row { display: flex; align-items: center; padding: 0 10px; min-height: 48px; }
.data-table-header .table-header-row { background-color: #fafafa; font-weight: 500; color: #333; font-size: 13px; border-bottom: 1px solid #ebedf0; }
.data-table-body .table-data-row { font-size: 14px; color: #666; background-color: #fff;}
.data-table-body .van-cell { padding: 0 !important; background: transparent !important; }
.data-table-body .van-cell::after { border-bottom: 1px solid #f0f0f0; left: 10px; right: 10px; }
.data-table-body .van-cell:last-child::after { border-bottom: none; }
.header-item, .data-item { padding: 8px 5px; box-sizing: border-box; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-item:first-child, .data-item:first-child { text-align: left; } /* 订单号左对齐 */
.order-number { cursor: pointer; color: #1989fa; }
.address-col { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; }
.time-col { font-size: 13px; color: #999;}
.price-item { font-weight: 500; }
.actions { text-align: right; display: flex; justify-content: flex-end; }
.action-button { margin-left: 5px; }
.actions .van-button--mini { min-width: auto; padding: 0 6px;}

.pagination-container { margin-top: 20px; display: flex; justify-content: center; }
.initial-loading { padding: 30px 0; text-align: center; }

.order-detail-popup { padding: 20px; max-height: 70vh; overflow-y: auto; }
.order-detail-popup .van-cell { padding: 8px 0; }
.order-detail-popup .van-cell__title { flex: 0 0 80px; color: #969799;}
.order-detail-popup .van-cell__value { color: #323233; text-align: left; }
</style>
