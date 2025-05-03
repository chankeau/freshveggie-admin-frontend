import apiClient from '@/plugins/axios';

/**
 * 分页查询订单列表 (管理端)。
 */
export const getOrderPage = (params) => {
  return apiClient.get('/api/order/page', { params });
};

/**
 * 修改订单状态 (或其他订单信息)。
 */
export const updateOrderStatus = (data) => {
   return apiClient.put('/api/order', data);
};

/**
 * 根据订单 ID 获取订单详情。
 */
export const getOrderDetailById = (orderId) => {
  return apiClient.get(`/api/order/${orderId}`);

};