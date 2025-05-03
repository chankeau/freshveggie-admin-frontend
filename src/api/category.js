import apiClient from '@/plugins/axios';

/**
 * 分页查询分类列表。
 */
export const getCategoryPage = (params) => {
  return apiClient.get('/api/category/page', { params });
};

/**
 * 添加分类。
 */
export const addCategory = (data) => {
  return apiClient.post('/api/category', data);
};

/**
 * 修改分类。
 */
export const editCategory = (data) => {
  return apiClient.put('/api/category', data);
};

/**
 * 删除分类 (单个/批量)。
 */
export const deleteCategory = (ids) => {
  const idString = Array.isArray(ids) ? ids.join(',') : ids;
  return apiClient.delete(`/api/category`, { params: { ids: idString } });
};

/**
 * 获取特定类型的分类列表 (用于下拉框)。
 */
export const getCategoryList = (params) => {
   return apiClient.get('/api/category/list', { params });
};