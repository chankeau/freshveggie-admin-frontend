import apiClient from '@/plugins/axios';

/**
 * 管理员登录 API。
 */
export const adminLoginApi = (data) => {
 return apiClient.post('/api/employee/login', data);
};

/**
 * 管理员/员工登出 API。
 */
export const logoutApi = () => {
    // 假设登出是统一的，或这里处理管理员登出
    return apiClient.post('/api/employee/logout');
};

