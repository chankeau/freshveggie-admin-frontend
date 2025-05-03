// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAdminUserStore } from '@/stores/adminUser';
import AdminLayout from '@/layout/AdminLayout.vue';
import { // 引入 Element Plus 图标
    DataAnalysis, Management, Goods, TakeawayBox, Document, UserFilled,
} from '@element-plus/icons-vue';

const routes = [
  {
    path: '/login',
    name: 'AdminLogin',
    component: () => import('../views/login/AdminLoginPage.vue'),
    meta: { isPublic: true }
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/dashboard/AdminDashboard.vue'),
        meta: { title: '仪表盘', icon: DataAnalysis }
      },
      {
        path: '/category', // 主要的分类管理路由
        name: 'AdminCategoryManagement', // 给一个唯一的 name
        component: () => import('../views/category/CategoryManagement.vue'),
        meta: { title: '分类管理', icon: Management }, // 使用 Management 图标
        // *** 关键：通过 props 传递类型，这里假设 '1' 代表商品分类 ***
        // *** 确保 CategoryManagement.vue 中 props.categoryType 的类型定义为 String 或 Number 对应 ***
        props: { categoryType: '1' } // 或 数字 1
      },
      // --- 商品管理 ---
      {
        path: '/dish',
        name: 'AdminDishManagement',
        component: () => import('../views/dish/DishManagement.vue'),
        meta: { title: '商品管理', icon: Goods }
      },
      {
        path: '/dish/add',
        name: 'AdminDishAdd',
        component: () => import('../views/dish/DishForm.vue'),
        meta: { title: '新增商品', hidden: true } // hidden: true 不在侧边栏显示
      },
      {
        path: '/dish/edit/:id',
        name: 'AdminDishEdit',
        component: () => import('../views/dish/DishForm.vue'),
        props: true,
        meta: { title: '编辑商品', hidden: true }
      },
      // --- 套餐管理 ---
      {
        path: '/setmeal',
        name: 'AdminSetmealManagement',
        component: () => import('../views/setmeal/SetmealManagement.vue'),
        meta: { title: '套餐管理', icon: TakeawayBox }
      },
      {
        path: '/setmeal/add',
        name: 'AdminSetmealAdd',
        component: () => import('../views/setmeal/SetmealForm.vue'),
        meta: { title: '新增套餐', hidden: true }
      },
      {
        path: '/setmeal/edit/:id',
        name: 'AdminSetmealEdit',
        component: () => import('../views/setmeal/SetmealForm.vue'),
        props: true,
        meta: { title: '编辑套餐', hidden: true }
      },
      // --- 订单管理 ---
      {
        path: '/order',
        name: 'AdminOrderManagement',
        component: () => import('../views/order/OrderManagement.vue'),
        meta: { title: '订单管理', icon: Document }
      },
      // --- 员工管理 ---
      {
        path: '/employee',
        name: 'AdminEmployeeManagement',
        component: () => import('../views/employee/EmployeeManagement.vue'),
        meta: { title: '员工管理', icon: UserFilled }
      },
      {
        path: '/employee/add',
        name: 'AdminEmployeeAdd',
        component: () => import('../views/employee/EmployeeForm.vue'),
        meta: { title: '新增员工', hidden: true }
      },
      {
        path: '/employee/edit/:id',
        name: 'AdminEmployeeEdit',
        component: () => import('../views/employee/EmployeeForm.vue'),
        props: true,
        meta: { title: '编辑员工', hidden: true }
      },
    
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes
});

const whiteList = ['/login'];

// beforeEach 守卫保持不变
router.beforeEach(async (to, from, next) => {
  let adminUserStore;
  try {
    adminUserStore = useAdminUserStore();
  } catch (error) {
    console.error("获取 Admin Store 失败:", error);
    // Pinia store 可能尚未初始化完成，尤其是在硬刷新后
    // 允许导航到登录页，或根据情况处理
    if (to.path !== '/login') {
        // 延迟一小段时间再试一次，或者直接重定向
        // await new Promise(resolve => setTimeout(resolve, 100));
        // try { adminUserStore = useAdminUserStore(); } catch(e) {}
        // if (!adminUserStore) {
             next('/login');
             return;
        // }
    } else {
        next(); // 允许访问登录页
        return;
    }
  }

  // 确保 adminUserStore 已经成功获取
  if (!adminUserStore) {
      console.error("无法获取 Admin Store 实例，重定向到登录");
      if (to.path !== '/login') {
          next('/login');
      } else {
          next();
      }
      return;
  }


  const isLoggedIn = adminUserStore.isLoggedIn;
  console.log(`Router Guard: Navigating to '${to.path}', User isLoggedIn: ${isLoggedIn}`);

  if (isLoggedIn) {
    if (to.path === '/login') {
      console.log("Router Guard: 已登录，访问登录页，重定向到 /dashboard");
      next({ path: '/dashboard' });
    } else {
      console.log(`Router Guard: 已登录，允许访问 ${to.path}`);
      next();
    }
  } else {
    if (whiteList.includes(to.path) || to.meta.isPublic) {
      console.log(`Router Guard: 未登录，访问白名单/公共页面 ${to.path}，允许访问`);
      next();
    } else {
      console.warn(`Router Guard: 未登录，访问受保护页面 ${to.path}，重定向到登录页`);
      next({ path: '/login', query: { redirect: to.fullPath } });
    }
  }
});

export default router;