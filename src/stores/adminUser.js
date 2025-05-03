// src/stores/adminUser.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/plugins/axios'; // 导入配置好的 apiClient
import router from '@/router';

export const useAdminUserStore = defineStore('adminUser', () => {
    const info = ref(JSON.parse(localStorage.getItem('adminInfo') || '{}'));
    const isLoggedIn = computed(() => !!info.value?.id); // 判断标准不变
    const adminName = computed(() => info.value?.name || '管理员'); // 获取名字不变

    function setAdminInfo(newInfo) {
        const infoToSet = newInfo && typeof newInfo === 'object' ? { ...newInfo } : {};
        // 对比一下，避免不必要的更新和 localStorage 写入
        if (JSON.stringify(info.value) !== JSON.stringify(infoToSet)) {
            console.log("[Admin Store setAdminInfo] 准备更新 info.value. 当前:", info.value, "新:", infoToSet);
            info.value = infoToSet;
            if (infoToSet && Object.keys(infoToSet).length > 0 && infoToSet.id) {
                try {
                    localStorage.setItem('adminInfo', JSON.stringify(infoToSet));
                    console.log("[Admin Store setAdminInfo] 成功写入 localStorage 'adminInfo'");
                } catch (e) {
                    console.error("[Admin Store setAdminInfo] 写入 localStorage 'adminInfo' 失败:", e);
                }
            } else {
                 if (localStorage.getItem('adminInfo')) { // 仅当存在时才移除并打印日志
                     localStorage.removeItem('adminInfo');
                     console.log("[Admin Store setAdminInfo] 清除 localStorage 'adminInfo'");
                 }
            }
        } else {
            // console.log("[Admin Store setAdminInfo] 新旧 info 相同，跳过更新。");
        }
    }

    function loginSuccess(responseData) {
        console.log("[Admin Store loginSuccess] 收到后端响应数据:", responseData);
    
        let adminData = null;
        // 后端 R.success(emp) 返回的是 R 对象，真实数据在 R.data 中
        if (responseData && responseData.data && typeof responseData.data === 'object') {
            adminData = responseData.data;
            console.log("[Admin Store loginSuccess] 从 response.data 提取 adminData:", adminData);
    
            // *** 关键：确认这里的检查使用了 Object.prototype.hasOwnProperty.call() ***
            if (Object.prototype.hasOwnProperty.call(adminData, 'id') && adminData.id !== null && adminData.id !== undefined && String(adminData.id).trim() !== '') {
                console.log(`[Admin Store loginSuccess] adminData 中找到有效 id: ${adminData.id} (类型: ${typeof adminData.id})`);
                setAdminInfo(adminData); // 存储用户信息
                console.log("Admin Store: 登录成功, 已存储管理员信息");
                return true; // 返回 true 表示登录成功
            } else {
                 // *** 关键：确认这里的 console.error 内部也使用了正确的调用方式 ***
                console.error(`[Admin Store loginSuccess] adminData 中未找到有效 id 或 id 值无效。 adminData.id 值: ${Object.prototype.hasOwnProperty.call(adminData, 'id') ? adminData.id : '不存在或无法访问'} (类型: ${typeof (adminData && adminData.id)})`); // 也检查 adminData 是否存在
            }
        } else {
            console.error("[Admin Store loginSuccess] 后端响应格式错误、data 字段无效或未包含用户数据。Response:", responseData);
        }
    
        console.error("Admin Store: loginSuccess 处理失败，未能存储有效的管理员信息。");
        setAdminInfo(null); // 确保失败时清除信息
        return false; // 返回 false 表示登录处理失败
    }
    

    async function logout() {
        console.log("Admin Store: 执行登出流程...");
        try {
            // *** 关键: 修正登出 API 路径 ***
            // 确保调用的是配置了 baseURL 和 withCredentials 的 apiClient
            await apiClient.post('/api/employee/logout'); // <--- 添加 /api 前缀
            console.log("Admin Store: 后端登出接口调用成功 (或至少请求已发送)。");
        } catch (error) {
            // Axios 拦截器已经处理并显示了错误信息，这里只记录一下 Store 层面的失败
            console.error("Admin Store: 调用后端登出接口时发生错误 (可能已在 Axios 拦截器中提示):", error.message);
            // 即便后端接口调用失败 (例如网络问题、后端报错)，前端也应该完成登出清理
        } finally {
            // 清理 Pinia store 和 localStorage 中的用户信息
            console.log("Admin Store: 正在清理前端管理员信息...");
            setAdminInfo(null);
            console.log("Admin Store: 前端管理员信息已清理。");

            // 登出后强制跳转到登录页
            // 使用 replace 避免用户按后退键回到需要登录的页面
            if (router.currentRoute.value.name !== 'AdminLogin') {
                console.log("Admin Store: 正在跳转到登录页...");
                router.replace({ name: 'AdminLogin' }).catch(err => {
                    // vue-router 4.x 对于重复导航会抛出错误，但这是预期的，可以忽略
                    if (err.name !== 'NavigationDuplicated' && !err.message.includes('Avoided redundant navigation')) {
                         console.error("Admin Store: 跳转到登录页时出错:", err);
                    }
                });
            } else {
                 console.log("Admin Store: 当前已在登录页，无需跳转。");
            }
        }
    }


    function loadAdminFromStorage() {
        const storedInfo = localStorage.getItem('adminInfo');
        let loadedInfo = {};
        if (storedInfo) {
            try {
                loadedInfo = JSON.parse(storedInfo);
                // 基础验证，确保至少有 id
                if (!loadedInfo || typeof loadedInfo !== 'object' || !loadedInfo.id) {
                    console.warn("Admin Store: localStorage 中的 adminInfo 格式无效或缺少 ID，将清除。");
                    loadedInfo = {};
                    localStorage.removeItem('adminInfo');
                }
            } catch (e) {
                console.error("Admin Store: 解析 localStorage 中的 adminInfo 失败", e);
                loadedInfo = {};
                localStorage.removeItem('adminInfo'); // 清除无效数据
            }
        }
        // 初始化时直接设置 info.value
        info.value = loadedInfo;
        console.log("Admin Store: 应用启动时从 storage 加载 - 管理员信息:", isLoggedIn.value ? "已加载" : "不存在或无效");
    }

    // 初始化时加载一次存储的信息
    loadAdminFromStorage();

    return {
        info,
        isLoggedIn,
        adminName,
        setAdminInfo, // 主要内部用，或者特殊情况需要外部更新
        loginSuccess, // 暴露给登录页面
        logout,       // 暴露给登出按钮或拦截器
        // loadAdminFromStorage // 通常不需要暴露，启动时自动执行
    };
},
{
    // persist: true, // 如果使用 pinia-plugin-persistedstate，可以简化持久化，但目前手动实现也可以
}
);