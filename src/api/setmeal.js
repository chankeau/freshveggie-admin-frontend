import apiClient from '@/plugins/axios';

/**
 * 分页查询套餐。
 */
export const getSetmealPage = (params) => {
  return apiClient.get('/api/setmeal/page', { params });
};

/**
 * 新增套餐。
 */
export const addSetmeal = (data) => {
  return apiClient.post('/api/setmeal', data);
};

/**
 * 修改套餐。
 */
export const editSetmeal = (data) => {
  return apiClient.put('/api/setmeal', data);
};

/**
 * 删除套餐 (单个/批量)。
 */
export const deleteSetmeal = (ids) => {
  const idString = Array.isArray(ids) ? ids.join(',') : ids;
  return apiClient.delete(`/api/setmeal`, { params: { ids: idString } });
};

/**
 * 修改套餐状态 (起售/停售)。
 */
export const setmealStatusByStatus = (params) => {
  return apiClient({
    url: `/api/setmeal/status/${params.status}`, 
    method: 'post',
    params: { ids: params.ids }
  });
};

/**
 * 根据 ID 查询套餐详情 (用于编辑)。
 */
export const querySetmealById = (id) => {
    return apiClient.get(`/api/setmeal/${id}`);
};