import apiClient from '@/plugins/axios';

/**
 * 分页查询员工列表。
 */
export const getEmployeeList = (params) => {
  return apiClient.get('/api/employee/page', { params });
};

/**
 * 新增员工。
 */
export const addEmployee = (data) => {
  return apiClient.post('/api/employee', data);
};

/**
 * 修改员工信息 (通常包含启用/禁用状态)。
 */
export const editEmployee = (data) => {
  // 假设修改接口可以同时处理状态更新
  return apiClient.put('/api/employee', data);
};

/**
 * 根据ID查询员工信息。
 */
export const queryEmployeeById = (id) => {
  return apiClient.get(`/api/employee/${id}`);
};

/**
 * 管理员登录。 (也可以放在 login.js)
 */
export const adminLoginApi = (data) => {
 return apiClient.post('/api/employee/login', data);
};

/**
 * 管理员登出。(也可以放在 login.js)
 */
export const adminLogoutApi = () => {
  return apiClient.post('/api/employee/logout');
};

