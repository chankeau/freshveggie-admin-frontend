<template>
  <div class="login">
    <div class="login-box">
      <!-- Image on the left -->
      <img src="@/assets/images/login/login-l.jpg" alt="Login background image">
      <!-- Login form on the right -->
      <div class="login-form">
        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="top" @submit.prevent="handleLogin">
          <div class="login-form-title">
            <!-- Logo -->
            <img src="@/assets/images/login/logo.png" style="width:150px;height:auto;" alt="蔬鲜递 Logo" />
          </div>
          <!-- Username Field -->
          <el-form-item prop="username" label="账号">
            <el-input
              v-model="loginForm.username"
              type="text"
              autocomplete="off"
              placeholder="请输入账号"
              maxlength="20"
              prefix-icon="User"
              clearable>
            </el-input>
          </el-form-item>
          <!-- Password Field -->
          <el-form-item prop="password" label="密码">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              maxlength="20"
              show-password
              @keyup.enter="handleLogin">
            </el-input>
          </el-form-item>
          <!-- Login Button -->
          <el-form-item style="width:100%; margin-top: 15px;">
            <el-button
              :loading="loading"
              class="login-btn"
              size="large"
              type="primary"
              style="width:100%;"
              native-type="submit"
              @click="handleLogin">
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // 引入 useRouter 和 useRoute
import { ElMessage } from 'element-plus';
import { adminLoginApi } from '@/api/login.js'; // 引入 API
import { useAdminUserStore } from '@/stores/adminUser'; // +++ 引入 Admin User Store +++

// --- 组件状态定义 ---
const router = useRouter(); // 获取 router 实例
const route = useRoute(); // 获取 route 实例，用于获取重定向路径
const loginFormRef = ref(null);
const loading = ref(false);
const adminStore = useAdminUserStore(); // +++ 获取 admin store 实例 +++

const loginForm = reactive({
  username: 'admin', // 可以设为空，或保留默认值方便测试
  password: '' // 密码通常不设默认值
});

// --- 表单验证规则 (保持不变) ---
const validateUsername = (rule, value, callback) => {
  if (!value || value.trim().length === 0) {
    callback(new Error('请输入用户名'));
  } else {
    callback();
  }
};
const validatePassword = (rule, value, callback) => {
  // 可以根据实际需求调整密码长度验证
  if (!value || value.length === 0) {
      callback(new Error('请输入密码'));
  } else if (value.length < 6) { // 示例：最小长度6位
      callback(new Error('密码必须至少为6位'));
  } else {
    callback();
  }
};

const loginRules = reactive({
  username: [{ required: true, validator: validateUsername, trigger: 'blur' }], // 添加 required
  password: [{ required: true, validator: validatePassword, trigger: 'blur' }] // 添加 required
});

// --- 方法定义 (修改 handleLogin) ---
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    // 1. 表单验证
    await loginFormRef.value.validate();
    loading.value = true; // 开始加载状态

    // 准备提交的数据
    const loginData = {
      username: loginForm.username.trim(),
      password: loginForm.password // 后端通常需要原始密码进行 MD5 或其他处理
    };

    try {
      // 2. 调用登录 API
      const res = await adminLoginApi(loginData); // res 是后端返回的 R 对象

      // 3. API 调用成功，调用 store 处理响应
      //    axios 拦截器已确保 code === 1 才会走到这里
      //    loginSuccess 会处理用户信息存储并返回 true/false
      const loginSuccessful = adminStore.loginSuccess(res);

      if (loginSuccessful) {
        // 4. Store 处理成功 (获取到有效用户信息并存储)
        ElMessage.success('登录成功');

        // --- 关键跳转逻辑 ---
        // 获取登录前的重定向地址，如果没有则默认跳转到后台首页
        const redirectPath = route.query.redirect || '/dashboard'; // 假设后台首页是 /dashboard
        router.replace(redirectPath);
        // --- 跳转结束 ---

        // 跳转后组件销毁，无需再设置 loading = false

      } else {
        // 5. Store 处理失败 (例如响应数据中缺少必要的 admin 信息)
        //    adminStore.loginSuccess 内部已打印错误日志
        ElMessage.error('登录失败：无法获取有效的用户信息');
        loading.value = false; // 登录流程中断，重置加载状态
      }

    } catch (apiError) {
      // 6. API 请求本身失败 (网络错误、code=0 等，已由 axios 拦截器处理并提示)
      console.error("登录请求失败 (API Error or Business Logic Error):", apiError);
      // 通常不需要在这里再次 ElMessage 提示
      loading.value = false; // 登录流程中断，重置加载状态
    }

  } catch (validationError) {
    // 7. 表单验证失败
    console.log('表单验证失败!', validationError);
    ElMessage.warning('请检查输入内容是否符合要求');
    loading.value = false; // 重置加载状态 (如果需要的话)
  }
};

// --- 生命周期钩子 ---
onMounted(() => {
  console.log('Admin Login Page Mounted');
  // 可选：检查是否已登录 (通过 store 判断)
  // 如果已经登录 (例如用户刷新页面或直接访问登录页)，则直接跳转
  // if (adminStore.isLoggedIn) {
  //    console.log('检测到已登录，正在重定向...');
  //    const redirectPath = route.query.redirect || '/dashboard';
  //    router.replace(redirectPath);
  // }
});

</script>

<style scoped>
/* Styles 保持不变 */
/* --- Login Container --- */
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8fafc;
}

/* --- Login Box --- */
.login-box {
  width: 800px;
  height: 450px;
  border-radius: 8px;
  display: flex;
  background-color: #ffffff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Left Image Area */
.login-box img {
  width: 55%;
  height: 100%;
  object-fit: cover;
}

/* --- Login Form Area --- */
.login-form {
  background: transparent;
  width: 45%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 40px;
  box-sizing: border-box;
}

.login-form .el-form {
  width: 100%;
  max-width: 300px;
  height: auto;
}

/* Logo/Title Area */
.login-form-title {
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 35px;
}

.login-form-title img {
  width: 150px;
  height: auto;
}

/* --- Input Fields --- */
.login-form :deep(.el-form-item__label) {
  color: #606266;
  line-height: normal;
  margin-bottom: 6px;
}

.login-form .el-form-item {
  margin-bottom: 25px;
}

:deep(.el-input__inner) {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  color: #333333;
  height: 40px;
  line-height: 40px;
  background: #ffffff;
}
:deep(.el-input__inner::placeholder) {
  color: #aeb5c4;
}

:deep(.el-input__inner:focus) {
  border-color: #84cc16;
  box-shadow: 0 0 0 1px rgba(132, 204, 22, 0.2);
}

:deep(.el-form-item.is-error .el-input__inner) {
  border-color: #f56c6c !important;
  box-shadow: none;
}

:deep(.el-input__prefix-inner) {
   align-items: center;
}
:deep(.el-input--prefix .el-input__inner) {
  padding-left: 30px;
}

/* --- Login Button --- */
.login-btn {
  border-radius: 4px;
  margin-top: 10px;
  font-weight: 500;
  font-size: 14px;
  border: none;
  background-color: #84cc16;
  color: #ffffff;
  width: 100%;
  transition: background-color 0.3s ease;
}

.login-btn:hover,
.login-btn:focus {
  background-color: #a3e635;
  color: #ffffff;
}

.login-btn.is-loading {
  background-color: #a3e635; /* 让加载状态颜色一致 */
  color: #ffffff;
}

/* 防止按钮在加载时文字移动 */
.login-btn span {
  display: inline-block;
}
</style>