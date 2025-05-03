// src/api/dashboard.js
import apiClient from '@/plugins/axios'; // 引入配置好的 axios 实例

/**
 * 获取仪表盘统计数据 (卡片)
 * GET /api/dashboard/stats
 */
export const getDashboardStatsApi = () => {
  return apiClient.get('/api/dashboard/stats');
};

/**
 * 获取最近 N 天订单统计数据 (折线图)
 * GET /api/dashboard/order-stats?days={days}
 * @param {number} days - 查询的天数，例如 7
 */
export const getOrderStatsApi = (days = 7) => { // 默认查询 7 天
  return apiClient.get('/api/dashboard/order-stats', {
    params: { days } // 将 days作为查询参数传递
  });
};

/**
 * 获取商品分类统计数据 (饼图)
 * GET /api/dashboard/category-stats
 */
export const getCategoryStatsApi = () => {
  return apiClient.get('/api/dashboard/category-stats');
};