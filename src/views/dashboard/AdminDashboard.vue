<template>
  <div class="dashboard-container">
    <!-- 1. 欢迎语 -->
    <el-card shadow="never" class="welcome-card">
      <!-- ... (欢迎语部分保持不变) ... -->
       <div class="welcome-content">
        <el-avatar :size="60" :src="avatarUrl" class="welcome-avatar">
           {{ adminName ? adminName.charAt(0) : '管' }}
        </el-avatar>
        <div class="welcome-text">
          <h2>{{ welcomeMessage }}，{{ adminName }}！</h2>
          <p>祝您工作愉快！</p>
        </div>
      </div>
    </el-card>

    <!-- 2. 统计数据卡片 -->
    <el-row :gutter="20" class="stats-row">
      <!-- ... (统计卡片部分保持不变) ... -->
       <el-col :xs="24" :sm="12" :md="12" :lg="6" v-for="(item, index) in statCards" :key="'stat-'+index"> <!-- key 修改避免冲突 -->
        <el-card shadow="hover" class="stat-card">
          <el-skeleton :loading="loading" animated>
            <template #template>
              <div class="skeleton-stat">
                <el-skeleton-item variant="text" style="width: 40%; margin-bottom: 10px;" />
                <el-skeleton-item variant="h3" style="width: 60%;" />
              </div>
            </template>
            <template #default>
              <div v-if="!error" class="stat-content" @click="navigateTo(item.route)">
                 <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
                   <el-icon :size="24" color="#fff"><component :is="item.rawIcon" /></el-icon>
                 </div>
                 <div class="stat-data">
                   <div class="stat-title">{{ item.title }}</div>
                   <div class="stat-value">{{ stats[item.key] ?? 'N/A' }}</div>
                 </div>
              </div>
               <el-alert v-else title="加载失败" :description="error" type="error" show-icon :closable="false"/>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>
   <!-- 4. 快捷操作入口 -->
   <el-card shadow="never" class="quick-actions-card">
    <template #header>
      <div class="card-header">
        <span>快捷操作</span>
      </div>
    </template>
    <!-- ... (快捷操作部分保持不变) ... -->
    <div class="quick-actions">
       <el-button type="primary" :icon="Plus" @click="navigateTo('/employee/add')">添加员工</el-button>
       <el-button type="success" :icon="Goods" @click="navigateTo('/dish/add')">添加商品</el-button>
       <el-button type="warning" :icon="TakeawayBox" @click="navigateTo('/setmeal/add')">添加套餐</el-button>
       <el-button :icon="Management" @click="navigateTo('/category')">分类管理</el-button>
    </div>
 </el-card>
    <!-- 3. ECharts 图表 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 订单折线图 -->
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="never">
           <template #header>
             <div class="card-header">
               <span>近7日订单趋势</span>
             </div>
           </template>
           <el-skeleton :loading="orderChartLoading" animated>
              <template #template>
                 <el-skeleton-item variant="rect" style="width: 100%; height: 300px;" />
              </template>
              <template #default>
                  <div v-if="orderChartError" class="chart-error">
                    <el-alert title="订单图表加载失败" :description="orderChartError" type="error" show-icon :closable="false"/>
                  </div>
                  <div v-else ref="orderChartRef" style="height: 300px;"></div>
               </template>
           </el-skeleton>
        </el-card>
      </el-col>

      <!-- 商品分类饼图 -->
       <el-col :xs="24" :sm="24" :md="12">
         <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>在售商品分类占比</span>
              </div>
            </template>
             <el-skeleton :loading="categoryChartLoading" animated>
               <template #template>
                  <el-skeleton-item variant="rect" style="width: 100%; height: 300px;" />
               </template>
               <template #default>
                   <div v-if="categoryChartError" class="chart-error">
                     <el-alert title="分类图表加载失败" :description="categoryChartError" type="error" show-icon :closable="false"/>
                   </div>
                   <div v-else ref="categoryChartRef" style="height: 300px;"></div>
               </template>
            </el-skeleton>
         </el-card>
       </el-col>
    </el-row>

 

  </div>
</template>

<script setup>
import { ref, onMounted, computed, markRaw, onBeforeUnmount, nextTick, watch } from 'vue'; // 引入 watch
import { useRouter } from 'vue-router';
import { ElMessage, ElAlert } from 'element-plus'; // 引入 ElAlert
import { useAdminUserStore } from '@/stores/adminUser';
// --- 引入所有 dashboard API ---
import { getDashboardStatsApi, getOrderStatsApi, getCategoryStatsApi } from '@/api/dashboard';
// --- 引入 ECharts ---
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// --- 注册 ECharts 必须的组件 ---
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  CanvasRenderer,
  // DatasetComponent
]);

// --- 引入 Element Plus 图标 ---
import {
  UserFilled, Document, Goods, TakeawayBox, Management, Plus, Clock
} from '@element-plus/icons-vue';
// --- 防抖函数 (可选，但推荐用于 resize) ---
import { debounce } from 'lodash-es'; // 需要安装 lodash-es: npm install lodash-es

const router = useRouter();
const adminStore = useAdminUserStore();

// --- 状态：卡片数据 ---
const loading = ref(true); // 卡片加载状态
const error = ref(null); // 卡片加载错误
const stats = ref({
  todayOrders: 0,
  pendingOrders: 0,
  totalEmployees: 0,
  totalDishes: 0,
  totalSetmeals: 0,
});

// --- 状态：图表数据与实例 ---
const orderChartRef = ref(null); // 折线图 DOM 引用
const categoryChartRef = ref(null); // 饼图 DOM 引用
let orderChartInstance = null; // 折线图 ECharts 实例
let categoryChartInstance = null; // 饼图 ECharts 实例

const orderChartLoading = ref(true); // 折线图加载状态
const categoryChartLoading = ref(true); // 饼图加载状态
const orderChartError = ref(null); // 折线图加载错误
const categoryChartError = ref(null); // 饼图加载错误

// --- 新增：存储图表数据 ---
const orderChartData = ref(null);
const categoryChartData = ref(null);

// --- 计算属性 ---
const adminName = computed(() => adminStore.adminName || '管理员');
const avatarUrl = computed(() => ''); // 可以后续添加管理员头像链接

const welcomeMessage = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const statCards = ref([
  { key: 'todayOrders', title: '今日订单数', icon: Document, rawIcon: markRaw(Document), bgColor: '#409EFF', route: '/order' },
  { key: 'pendingOrders', title: '待处理订单', icon: Clock, rawIcon: markRaw(Clock), bgColor: '#E6A23C', route: '/order?status=pending' },
  { key: 'totalEmployees', title: '员工总数', icon: UserFilled, rawIcon: markRaw(UserFilled), bgColor: '#67C23A', route: '/employee' },
  { key: 'totalDishes', title: '在售商品数', icon: Goods, rawIcon: markRaw(Goods), bgColor: '#F56C6C', route: '/dish' }, // 修改为在售商品
]);


// --- 数据获取：卡片 ---
const fetchStats = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await getDashboardStatsApi();
    console.log("Dashboard API 响应 (卡片 R 对象):", response);
    if (response && response.code === 1 && response.data) {
       stats.value.todayOrders = response.data.todayOrders ?? 0;
       stats.value.pendingOrders = response.data.pendingOrders ?? 0;
       stats.value.totalEmployees = response.data.totalEmployees ?? 0;
       stats.value.totalDishes = response.data.totalDishes ?? 0; // 假设后端返回的是在售商品数
       // stats.value.totalSetmeals = response.data.totalSetmeals ?? 0; // 如果需要显示套餐卡片
    } else {
      throw new Error(response?.msg || '获取卡片数据失败');
    }
  } catch (err) {
    console.error("获取仪表盘卡片数据失败:", err);
    error.value = err.message || '加载卡片数据时出错';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

// --- 数据获取与图表初始化：订单折线图 ---
const initOrderChart = () => {
  // 再次检查 ref 是否有效 和 数据是否已获取
  if (!orderChartRef.value || !orderChartData.value) {
    console.warn("订单图表 DOM 或数据尚未准备好，无法初始化。Ref:", orderChartRef.value, "Data:", orderChartData.value);
    return;
  }
   // 检查实例是否已存在，如果存在先销毁
  if (orderChartInstance) {
      console.log("销毁旧的订单图表实例");
      orderChartInstance.dispose();
      orderChartInstance = null; // 确保实例被置空
  }

  console.log("尝试初始化订单图表，DOM Ref:", orderChartRef.value);

  const data = orderChartData.value; // 使用存储的数据
  const dates = data.map(item => item.date);
  const counts = data.map(item => item.count);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' }}
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', containLabel: true
    },
    xAxis: [
      { type: 'category', boundaryGap: false, data: dates }
    ],
    yAxis: [
      { type: 'value' }
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        // stack: 'Total', // 去掉堆叠
        areaStyle: { opacity: 0.3 },
        emphasis: { focus: 'series' },
        data: counts,
        smooth: true,
        color: '#409EFF'
      }
    ]
  };

  try {
      orderChartInstance = echarts.init(orderChartRef.value);
      orderChartInstance.setOption(option);
      console.log("订单图表初始化成功");
  } catch (e) {
      console.error("初始化订单图表时发生错误:", e);
      orderChartError.value = '渲染图表时出错';
  }
};

const fetchOrderStats = async () => {
  orderChartLoading.value = true;
  orderChartError.value = null;
  orderChartData.value = null; // 重置数据
  try {
    const response = await getOrderStatsApi(7); // 获取最近 7 天的数据
    console.log("Dashboard API 响应 (订单统计 R 对象):", response);
    if (response && response.code === 1 && Array.isArray(response.data)) {
       orderChartData.value = response.data; // 存储获取到的数据
       // 数据获取成功， watcher 会在 loading 变为 false 且 ref 准备好后触发 init
    } else {
      throw new Error(response?.msg || '获取订单统计数据失败');
    }
  } catch(err) {
     console.error("获取订单统计数据失败:", err);
     orderChartError.value = err.message || '加载订单图表数据时出错';
     // 不再弹窗，由模板中的 ElAlert 显示
     // ElMessage.error(orderChartError.value);
  } finally {
     // 无论成功失败，最终设置 loading 为 false
     orderChartLoading.value = false;
     console.log("订单统计数据获取完成，loading 状态设置为 false");
  }
};

// --- 数据获取与图表初始化：分类饼图 ---
const initCategoryChart = () => {
   // 再次检查 ref 是否有效 和 数据是否已获取
   if (!categoryChartRef.value || !categoryChartData.value) {
      console.warn("分类图表 DOM 或数据尚未准备好，无法初始化。Ref:", categoryChartRef.value, "Data:", categoryChartData.value);
      return;
   }
   // 检查实例是否已存在，如果存在先销毁
   if (categoryChartInstance) {
      console.log("销毁旧的分类图表实例");
      categoryChartInstance.dispose();
      categoryChartInstance = null; // 确保实例被置空
   }

  console.log("尝试初始化分类图表，DOM Ref:", categoryChartRef.value);
  const data = categoryChartData.value; // 使用存储的数据

   const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b} : {c} ({d}%)' // 显示 名称 : 数值 (百分比)
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'center' // 将图例放在左侧垂直居中
        },
        series: [
          {
            name: '商品分类',
            type: 'pie',
            radius: ['40%', '70%'], // 设置成环形图
            center: ['65%', '50%'], // 将饼图向右移动一点，给图例留空间
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10, // 圆角
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false, // 不直接显示标签
              position: 'center'
            },
            emphasis: {
              label: {
                show: true, // 高亮时在中间显示标签
                fontSize: '20',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: data // 后端返回的数据格式正好匹配
          }
        ]
      };

    try {
        categoryChartInstance = echarts.init(categoryChartRef.value);
        categoryChartInstance.setOption(option);
        console.log("分类图表初始化成功");
    } catch (e) {
        console.error("初始化分类图表时发生错误:", e);
        categoryChartError.value = '渲染图表时出错';
    }
};

const fetchCategoryStats = async () => {
  categoryChartLoading.value = true;
  categoryChartError.value = null;
  categoryChartData.value = null; // 重置数据
   try {
     const response = await getCategoryStatsApi();
     console.log("Dashboard API 响应 (分类统计 R 对象):", response);
     if (response && response.code === 1 && Array.isArray(response.data)) {
        categoryChartData.value = response.data; // 存储获取到的数据
        // 数据获取成功， watcher 会在 loading 变为 false 且 ref 准备好后触发 init
     } else {
         throw new Error(response?.msg || '获取分类统计数据失败');
     }
   } catch(err) {
      console.error("获取分类统计数据失败:", err);
      categoryChartError.value = err.message || '加载分类图表数据时出错';
       // 不再弹窗，由模板中的 ElAlert 显示
      // ElMessage.error(categoryChartError.value);
   } finally {
     // 无论成功失败，最终设置 loading 为 false
     categoryChartLoading.value = false;
      console.log("分类统计数据获取完成，loading 状态设置为 false");
   }
};

// --- 导航 ---
const navigateTo = (path) => {
  if (path) {
    router.push(path);
  }
};

// --- 图表响应式调整 (防抖) ---
const handleResize = debounce(() => {
  console.log("窗口大小调整，尝试 resize 图表...");
  if (orderChartInstance) {
    orderChartInstance.resize();
     console.log("订单图表 resized");
  }
  if (categoryChartInstance) {
    categoryChartInstance.resize();
    console.log("分类图表 resized");
  }
}, 300); // 300ms 防抖

// --- 生命周期钩子与监听 ---
onMounted(() => {
  console.log('Admin Dashboard Mounted - 开始加载数据');
  fetchStats(); // 获取卡片数据
  fetchOrderStats(); // 获取订单图表数据 (只获取，不初始化)
  fetchCategoryStats(); // 获取分类图表数据 (只获取，不初始化)

  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  console.log('Admin Dashboard Unmounting - 清理监听和图表实例');
  window.removeEventListener('resize', handleResize);

  // 销毁 ECharts 实例
  if (orderChartInstance) {
    orderChartInstance.dispose();
    orderChartInstance = null;
  }
  if (categoryChartInstance) {
    categoryChartInstance.dispose();
    categoryChartInstance = null;
  }
});

// --- Watcher: 监听 Loading 状态和 Ref 的变化 ---
// 只有当 loading 结束 (变为 false) 且 DOM 元素 (ref) 准备好时，才尝试初始化图表
watch([orderChartLoading, orderChartRef], ([loading, refValue]) => {
  console.log(`订单图表 Watcher 触发: loading=${loading}, refValue=${!!refValue}`);
  if (!loading && refValue) {
    console.log("满足订单图表初始化条件，准备调用 init");
    nextTick(() => { // 确保 DOM 更新完成
        initOrderChart();
    });
  } else if (loading) {
    console.log("订单图表还在加载中...");
  } else if (!refValue) {
    console.log("订单图表的 Ref 尚未准备好...");
  }
});

watch([categoryChartLoading, categoryChartRef], ([loading, refValue]) => {
    console.log(`分类图表 Watcher 触发: loading=${loading}, refValue=${!!refValue}`);
    if (!loading && refValue) {
    console.log("满足分类图表初始化条件，准备调用 init");
    nextTick(() => { // 确保 DOM 更新完成
        initCategoryChart();
    });
  } else if (loading) {
    console.log("分类图表还在加载中...");
  } else if (!refValue) {
    console.log("分类图表的 Ref 尚未准备好...");
  }
});

</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f0f2f5; // 背景色
}

.el-card {
  margin-bottom: 20px; // 统一卡片间距
}

.welcome-card {
  .welcome-content {
    display: flex;
    align-items: center;
  }
  .welcome-avatar {
    margin-right: 20px;
    flex-shrink: 0; /* 防止头像被压缩 */
  }
  .welcome-text {
    h2 {
      margin: 0 0 5px 0;
      font-size: 20px;
      font-weight: 600;
    }
    p {
      margin: 0;
      color: #888;
    }
  }
}

.stats-row {
  .stat-card {
    cursor: pointer; // 提示卡片可点击
    .el-skeleton {
        padding: 10px; // 给骨架屏一些内边距
    }
    .stat-content {
       display: flex;
       align-items: center;
       justify-content: space-between; // 让图标和数据分开
       padding: 10px; // 添加内边距
    }
     .stat-icon {
        width: 50px;
        height: 50px;
        border-radius: 8px; // 圆角
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
     }
     .stat-data {
        text-align: right; // 数据右对齐
        .stat-title {
          color: #888;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 22px;
          font-weight: bold;
        }
     }
  }
  .skeleton-stat {
     display: flex;
     flex-direction: column;
     align-items: flex-end; // 骨架也右对齐
     padding: 10px;
   }
}


.chart-row {
   .chart-error {
     display: flex;
     justify-content: center;
     align-items: center;
     height: 300px; /* 与图表高度一致 */
     color: #F56C6C;
     .el-alert {
       width: 80%;
     }
   }
}


.quick-actions-card {
  .quick-actions {
    display: flex;
    flex-wrap: wrap; // 允许换行
    gap: 10px; // 按钮间距
  }
}

.card-header { // 统一卡片头样式
  font-weight: bold;
}

.dashboard-container {
  padding: 20px;
  background-color: #f4f6f9; /* 页面背景色 */
}
.welcome-card {
  margin-bottom: 20px;
  background-color: #e9f7ef; /* 淡绿色背景 */
  border: 1px solid #c8e6c9;
}
.welcome-content {
  display: flex;
  align-items: center;
}
.welcome-avatar {
  margin-right: 20px;
  flex-shrink: 0;
  background-color: #d1e7dd;
  color: #155724;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
}
.welcome-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.welcome-text h2 {
  margin: 0 0 5px 0;
  font-size: 1.3em;
  color: #34495e;
}
.welcome-text p {
  margin: 0;
  color: #555;
  font-size: 0.9em;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card .el-card__body {
  padding: 0;
}
.stat-card .el-skeleton {
    padding: 20px;
}
.skeleton-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.stat-content:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
  flex-shrink: 0;
}
.stat-data {
  flex-grow: 1;
  min-width: 0;
}
.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}
.stat-card .el-alert {
    margin: 20px;
}
.quick-actions-card {
  margin-bottom: 20px;
}
.card-header {
  font-weight: bold;
}
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
@media (max-width: 768px) {
  .quick-actions .el-button {
    width: calc(50% - 8px);
  }
}
@media (max-width: 480px) {
  .quick-actions .el-button {
    width: 100%;
  }
}
</style>