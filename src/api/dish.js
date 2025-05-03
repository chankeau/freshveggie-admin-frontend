import apiClient from '@/plugins/axios';

/**
 * 分页查询商品/菜品。
 */
export const getDishPage = (params) => {
  return apiClient.get('/api/dish/page', { params });
};

/**
 * 根据条件查询商品列表 (通常用于套餐管理添加菜品)。
 */
export const queryDishList = (params) => {
  return apiClient.get('/api/dish/list', { params });
};

// 注意：getDishByName 和 queryDishList 实际调用的是同一个后端接口，保留一个即可，或根据具体参数区分。
// 这里假设 getDishByName 不再需要，若需要则修改为：
// export const getDishByName = (params) => { return apiClient.get('/api/dish/list', { params }); }


/**
 * 新增商品。
 */
export const addDish = (data) => {
  return apiClient.post('/api/dish', data);
};

/**
 * 修改商品。
 */
export const editDish = (data) => {
  return apiClient.put('/api/dish', data);
};

/**
 * 删除商品 (单个/批量)。
 */
export const deleteDish = (ids) => {
  const idString = Array.isArray(ids) ? ids.join(',') : ids;
  return apiClient.delete(`/api/dish`, { params: { ids: idString } });
};

/**
 * 修改商品售卖状态 (单个/批量)。
 */
export const dishStatusByStatus = (params) => {
  // params 包含 status 和 ids (逗号分隔字符串)
  return apiClient.post(`/api/dish/status/${params.status}`, null, { params: { ids: params.ids } });
};

/**
 * 根据 ID 查询商品详情 (用于编辑)。
 */
export const queryDishById = (id) => {
    return apiClient.get(`/api/dish/${id}`);
};