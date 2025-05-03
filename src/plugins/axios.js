// src/plugins/axios.js
import axios from 'axios';
import { ElMessage } from 'element-plus';
// --- 引入 Pinia Store ---
// 注意：在拦截器内部动态获取 store 实例
import { useAdminUserStore } from '@/stores/adminUser';
// ---------------------
import router from '@/router';

const apiClient = axios.create({
    timeout: 10000,
    // withCredentials: true, // 如果后端确认不再需要 cookie 验证了，可以注释掉
});

// --- 修改后的请求拦截器 ---
apiClient.interceptors.request.use(
    config => {
        console.log('Admin Request Interceptor:', config.method?.toUpperCase(), config.url);
        if (!config.headers['Accept']) {
            config.headers['Accept'] = 'application/json, text/plain, */*';
        }

        // --- 动态获取 Store 实例 ---
        const adminStore = useAdminUserStore();
        const token = adminStore.token; // 从 Store 获取 Token
        // -------------------------

        // --- 如果 Token 存在，则添加到请求头 ---
        if (token) {
            // 常见的 Token Header 是 'Authorization': 'Bearer <token>'
            // 请根据你的后端要求确认 Header 名称和格式 (例如 'token', 'X-Token', 'Authorization')
            config.headers.Authorization = `Bearer ${token}`;
            // 或者如果后端需要不同的头，例如： config.headers['Admin-Token'] = token;
            console.log('Admin Request Interceptor: Added Authorization Header');
        } else {
            console.log('Admin Request Interceptor: No token found in store.');
        }
        // ----------------------------------

        return config;
    },
    error => {
        console.error('Admin Request Interceptor Error:', error);
        return Promise.reject(error);
    }
);

// --- 响应拦截器 (基本保持不变，确保其逻辑与修改后的 Store 一致) ---
// 你之前的响应拦截器代码逻辑（处理 code=1, code=0/NOTLOGIN, 401等）
// 已经考虑到了未登录状态和跳转，可以保持使用。
// 只需要确保它在判断 401 或 NOTLOGIN 后调用的是 adminStore.logout()，
// 而 adminStore.logout() 现在会正确清理 token 和 info。
// (你的原响应拦截器代码看起来是OK的)
apiClient.interceptors.response.use(
    response => {
        // ... (你之前的成功和业务失败处理逻辑) ...
        // 确保在处理 NOTLOGIN 时获取最新的 store 实例
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            const res = response.data;
            if (res.code === 1) {
                // ... 成功处理
                return res; // 或者 res.data, 取决于 API 设计
            } else {
                 // 业务错误
                 if (res.code === 0 && res.msg === 'NOTLOGIN') {
                     const adminStore = useAdminUserStore(); // 重新获取 store 实例
                     const currentRoute = router.currentRoute.value;
                     const originalRequestUrl = response.config.url;
                     const loginUrl = '/employee/login';
                     if (currentRoute.name !== 'AdminLogin' && originalRequestUrl !== loginUrl) {
                         console.warn('Admin Response Interceptor (JSON NOTLOGIN): Redirecting.');
                         adminStore.logout(); // 调用更新后的 logout
                         ElMessage.warning('登录状态失效，请重新登录');
                         // router.replace 已经在 logout 内部处理
                     } else {
                         console.warn('Admin Response Interceptor (JSON NOTLOGIN): On login page or login request. Ignoring redirect.');
                         ElMessage.error(res.msg || '登录失败或会话无效');
                     }
                 } else {
                    // 其他业务错误
                     ElMessage.error(res.msg || '操作失败');
                 }
                 return Promise.reject(new Error(res.msg || 'Business Error'));
            }
        } else {
             // 非 JSON 响应
            return response;
        }
    },
    error => {
        console.error('Admin Network/Response Error:', error.config?.url, error.message, error.response);
        let message = '请求失败';
        const adminStore = useAdminUserStore(); // 获取 store 实例
        const currentRoute = router.currentRoute.value;
        const originalRequestUrl = error.config?.url;
        const loginUrl = '/employee/login';

        // ... (你之前的超时、网络错误处理) ...
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            message = '请求超时';
        } else if (!error.response) {
            message = '网络连接错误';
        } else {
            const status = error.response.status;
            const errorData = error.response.data;
            const backendMsg = errorData?.msg;

            if (status === 401) {
                 if (currentRoute.name !== 'AdminLogin' && originalRequestUrl !== loginUrl) {
                      console.warn('Admin Network Error Interceptor (401): Redirecting.');
                      message = backendMsg || '登录状态失效 (401)';
                      adminStore.logout(); // 调用更新后的 logout
                 } else {
                     console.warn('Admin Network Error Interceptor (401): On login page or login request. Displaying error.');
                     message = backendMsg || `身份验证失败 (${status})`;
                 }
            }
            // ... (你之前的 404, 500 等处理) ...
            else if (status === 404) message = backendMsg || `未找到资源 (${status})`;
            else if (status >= 500) message = backendMsg || `服务器错误 (${status})`;
            else message = backendMsg || `请求错误 (${status})`;
        }

        ElMessage({ message: message, type: 'error', duration: 5000 });
        return Promise.reject(error);
    }
);


export default apiClient;