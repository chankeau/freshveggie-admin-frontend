<template>
  <div class="page-container dish-form">
    <el-card class="form-card" shadow="never">
      <!-- 商品表单，包含基本信息、图片上传、描述和状态设置。 -->
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" @submit.prevent>

        <div class="form-section">
          <h3 class="form-section-title">菜品基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="商品名称" prop="name">
                <el-input v-model.trim="formData.name" placeholder="请填写商品名称" maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="12">
               <el-form-item label="商品价格" prop="price">
                  <!-- 使用 el-input-number 控制价格输入，确保精度和最小值。 -->
                  <el-input-number
                     v-model="formData.price"
                     :precision="2"
                     :min="0"
                     :step="1"
                     placeholder="请输入商品价格"
                     controls-position="right"
                     style="width: 100%;"
                  />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
             <el-col :span="12">
                 <el-form-item label="单位" prop="unit">
                   <el-input v-model="formData.unit" placeholder="例如：份 / 斤 / 个" maxlength="10" show-word-limit/>
                 </el-form-item>
             </el-col>
             <el-col :span="12">
               <el-form-item label="商品分类" prop="categoryId">
                  <!-- 使用 el-radio-group 选择分类，value 属性传递分类 ID。 -->
                  <el-radio-group v-model="formData.categoryId" class="category-radio-group">
                      <el-radio
                         v-for="category in dishCategories"
                         :key="category.id"
                         :value="category.id" 
                         :label="category.id">  
                         {{ category.name }}
                      </el-radio>
                      <div v-if="dishCategories.length === 0" class="no-category-tip">
                         请先去<router-link to="/category" class="link"> 分类管理 </router-link>添加商品分类
                      </div>
                  </el-radio-group>
               </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">商品图片</h3>
          <el-form-item label="选择图片" prop="image">
            <!-- 使用自定义的 ImageUploader 组件处理图片上传和预览。 -->
            <ImageUploader v-model="formData.image" :previewBaseUrl="previewBaseUrl" />
          </el-form-item>
        </div>

        <div class="form-section">
           <h3 class="form-section-title">商品描述</h3>
           <el-form-item label="描述" prop="description">
                <!-- 使用带字数限制的文本域输入商品描述。 -->
               <el-input
                  v-model="formData.description"
                  type="textarea"
                  :rows="3" 
                  maxlength="200"
                  placeholder="请输入商品描述 (最多200字)"
                  show-word-limit
               />
           </el-form-item>
         </div>

        <div class="form-section">
          <h3 class="form-section-title">售卖状态</h3>
           <el-form-item label="是否启售" prop="status">
              <!-- 使用 el-switch 控制商品的启售状态 (1:启售, 0:停售)。 -->
              <el-switch
                v-model="formData.status"
                :active-value="1"
                :inactive-value="0"
              />
           </el-form-item>
         </div>

        <el-form-item>
          <div class="button-group">
             <!-- 提供取消、保存、保存并继续添加的操作按钮。 -->
            <el-button @click="goBack"> 取消 </el-button>
            <el-button type="primary" @click="onSubmit()" :loading="submitLoading"> 保存 </el-button>
            <el-button
               v-if="actionType === 'add'"
               type="success"
               @click="onSubmit('goAnd')"
               :loading="submitLoading"
               class="continue-btn"
              >
                保存并继续添加
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
     <!-- 提供返回顶部的便捷功能。 -->
     <el-backtop target=".page-container" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElNotification } from 'element-plus';
import { getCategoryList } from '@/api/category';
import { addDish, editDish, queryDishById } from '@/api/dish';
import ImageUploader from '@/components/ImageUploader.vue'; // 引入上传组件

// 初始化路由、获取路由参数及操作类型（新增或编辑）。
const router = useRouter();
const route = useRoute();
const dishId = route.params.id || null;
const actionType = computed(() => (dishId ? 'edit' : 'add'));

// 状态引用：表单引用、加载状态、分类列表、图片预览基础URL。
const formRef = ref(null);
const submitLoading = ref(false);
const dishCategories = ref([]);
const previewBaseUrl = ref('');

// 定义响应式的表单数据模型。
const formData = reactive({
  id: dishId,
  name: '',
  categoryId: null,
  price: undefined,
  unit: '',
  image: '', // 用于 v-model 绑定 ImageUploader 返回的文件名
  description: '',
  status: 1,
});

// 定义表单校验规则。
const formRules = {
  name: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [
    { required: true, message: '价格不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格必须大于等于0', trigger: 'blur' }
  ],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  image: [{ required: true, message: '请上传商品图片', trigger: 'change' }],
};

// 异步获取商品分类列表（type: 1 代表商品）。
const fetchDishCategories = async () => {
    try {
        const response = await getCategoryList({ type: 1, pageSize: 1000 });
        if (response && response.code === 1) {
            dishCategories.value = response.data?.records || response.data || [];
             // 新增时默认选中第一个分类
             if (actionType.value === 'add' && dishCategories.value.length > 0 && !formData.categoryId) {
                formData.categoryId = dishCategories.value[0].id;
             }
             // 编辑时检查当前分类是否存在
             if (actionType.value === 'edit' && formData.categoryId && !dishCategories.value.some(cat => cat.id === formData.categoryId)) {
                 ElNotification({ title: '警告', message: '当前商品所属分类可能已被删除或禁用', type: 'warning', duration: 4000 });
             }
        }
    } catch (error) {
      console.error("获取商品分类失败:", error);
      ElNotification({ title: '错误', message: '获取商品分类列表失败', type: 'error' });
    }
};

// 初始化函数：设置图片预览URL，获取分类，如果是编辑模式则获取菜品数据。
const init = async () => {
  // 构建后端下载图片的 URL 前缀
  // previewBaseUrl.value = apiClient.defaults.baseURL + '/common/download?name='; // 如果 apiClient 有 baseURL '/api'
   previewBaseUrl.value = '/api/common/download?name='; // 假设代理后可以直接访问 /api

  await fetchDishCategories();

  if (actionType.value === 'edit') {
    try {
      const response = await queryDishById(dishId); // 请求菜品详情
      if (response && response.code === 1 && response.data) {
        Object.assign(formData, response.data); // 将返回数据填充到表单
        formData.price = Number(response.data.price); // 价格转为数字类型
        // 注意：如果 categoryId 后端返回是数字而 ElRadio 需要字符串，可能要做转换
         if (formData.categoryId && typeof formData.categoryId !== 'string') {
             formData.categoryId = String(formData.categoryId); // 示例转换
         }
      } else {
        ElNotification({ type: 'error', title: '错误', message: response?.msg || '获取商品信息失败' });
        goBack(); // 获取失败则返回列表页
      }
    } catch (error) {
       console.error("编辑模式下获取商品信息失败:", error);
       ElNotification({ type: 'error', title: '请求失败', message: '请求商品信息异常' });
       goBack();
    }
  }
};

// 提交表单处理函数：校验表单，根据操作类型调用新增或编辑接口。
const onSubmit = async (mode = '') => {
    if (!formRef.value) return;
    submitLoading.value = true;
    try {
        await formRef.value.validate(); // 触发 Element Plus 表单校验
        const params = { ...formData }; // 准备提交的数据

        let response;
        if (actionType.value === 'edit') {
            response = await editDish(params); // 调用编辑接口
        } else {
            response = await addDish(params); // 调用新增接口
        }

        if (response && response.code === 1) {
            ElMessage.success(`商品${actionType.value === 'add' ? '添加' : '修改'}成功！`);
            if (mode === 'goAnd') {
                 // 保存并继续：重置表单字段和图片
                 formRef.value.resetFields();
                 formData.image = ''; // 需要手动清空图片 v-model
                 // 可能需要重置 categoryId 到第一个
                 if(dishCategories.value.length > 0) formData.categoryId = dishCategories.value[0].id;

            } else {
                goBack(); // 保存后返回列表页
            }
        } else {
             // 后端返回 code != 1
             ElNotification({ type: 'error', title: '操作失败', message: response?.msg || '保存商品失败' });
        }
    } catch (validationErrors) {
        // 表单校验未通过
        if (validationErrors) { // 确保是校验错误对象
           console.log('表单校验失败:', validationErrors);
           ElMessage.error('请检查表单填写是否完整且正确');
        } else {
           // API 请求本身的错误 (已在拦截器或上面处理)
            console.error("API 请求出错 (未被拦截器完全处理?):", validationErrors);
        }

    } finally {
       submitLoading.value = false; // 结束加载状态
    }
};

// 返回商品列表页。
const goBack = () => { router.push('/dish'); };

// 组件挂载后执行初始化逻辑。
onMounted(() => {
  init();
});

</script>

<style lang="scss" scoped>
/* 页面和表单卡片的整体布局与样式。 */
.page-container {
  padding: 20px;
  background-color: #f4f4f5; /* Use a light background for the page */
  height: calc(100vh - 50px); /* Adjust based on your header height */
  overflow-y: auto; /* Allow scrolling within the page */
}
.form-card {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px; /* Add padding inside the card */
}

/* 表单区域分隔样式。 */
.form-section {
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #ebeef5;
  &:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
}

/* 表单区域标题样式。 */
.form-section-title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 20px;
  padding-left: 10px;
  border-left: 3px solid var(--el-color-primary);
}

/* 分类单选按钮组的样式。 */
.category-radio-group {
  width: 100%;
}
.category-radio-group .el-radio {
  margin-right: 15px; /* Spacing between radios */
  margin-bottom: 8px; /* Vertical spacing for wrapping */
}

/* 没有可用分类时的提示信息样式。 */
.no-category-tip {
  font-size: 12px;
  color: #e6a23c; /* Warning color */
}
.no-category-tip .link {
  color: var(--el-color-primary);
  text-decoration: none;
  margin-left: 5px;
   &:hover { text-decoration: underline; }
}

/* 表单底部按钮组的居中和间距。 */
.button-group {
  display: flex;
  justify-content: center;
  gap: 15px; /* Space between buttons */
  margin-top: 10px; /* Space above buttons */
  width: 100%;
}
.button-group .el-button {
    min-width: 100px; /* Ensure buttons have a decent width */
}
/* 确保上传组件容器正常显示。 */
:deep(.el-form-item__content .image-uploader-container) {
   line-height: normal; /* Prevent line-height issues */
   display: block; /* Ensure it takes block space */
}
</style>