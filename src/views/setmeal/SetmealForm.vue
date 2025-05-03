<template>
  <div class="page-container setmeal-form">
    <div class="form-card">
      <!-- 使用 Element Plus 表单 -->
      <el-form @submit.prevent="onSubmit" ref="formRef" :model="formData" :rules="rules" label-width="100px" v-loading="loading">
        <el-divider content-position="left">套餐基本信息</el-divider>
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model.trim="formData.name" placeholder="请输入套餐名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="套餐分类" prop="categoryId">
           <el-select v-model="formData.categoryId" placeholder="请选择套餐分类" style="width: 100%;">
             <el-option
               v-for="category in setmealCategories"
               :key="category.id"
               :label="category.name"
               :value="category.id"
             />
             <template #empty>
               <div class="no-category-tip">
                 请先去<router-link to="/category" class="link">分类管理</router-link>添加套餐分类
               </div>
             </template>
           </el-select>
        </el-form-item>
        <el-form-item label="套餐价格" prop="price">
           <el-input v-model="formData.price" placeholder="请输入套餐价格" type="number" style="width: 100%;">
              <template #append>元</template>
           </el-input>
         </el-form-item>
        <!-- 套餐状态，如果需要 -->
        <!-- <el-form-item label="套餐状态" prop="status">
           <el-switch
             v-model="formData.status"
             :active-value="1"
             :inactive-value="0"
             active-text="启售"
             inactive-text="停售"
            />
        </el-form-item> -->


         <el-divider content-position="left">套餐商品</el-divider>
         <!-- 直接校验 formData.setmealDishes -->
         <el-form-item prop="setmealDishes" label-width="0">
           <div class="add-dish-container full-width">
              <el-button type="primary" :icon="Plus" @click="showDishDialog = true" size="small" class="add-dish-btn">
                添加商品
              </el-button>
              <!-- 直接使用 formData.setmealDishes 渲染表格 -->
              <el-table :data="formData.setmealDishes" stripe border v-if="formData.setmealDishes.length > 0" style="width: 100%; margin-top: 15px;">
                <el-table-column prop="name" label="名称" />
                <el-table-column prop="price" label="原价" align="center" width="100">
                   <template #default="scope">￥{{ formatPrice(scope.row.price) }}</template>
                </el-table-column>
                <el-table-column label="份数" align="center" width="160">
                  <template #default="scope">
                     <el-input-number v-model="scope.row.copies" :min="1" :max="99" size="small" controls-position="right"/>
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="80">
                  <template #default="scope">
                    <el-button type="danger" link @click="removeSelectedDish(scope.$index)">删除</el-button>
                  </template>
                </el-table-column>
                 <template #empty>
                   <el-empty description="暂无商品" :image-size="50" />
                 </template>
              </el-table>
              <el-empty v-else description="请添加套餐内的商品" image-size="80" />
           </div>
         </el-form-item>

        <el-divider content-position="left">套餐图片</el-divider>
        <el-form-item label="选择图片" prop="image">
           <el-upload
               class="setmeal-uploader"
               :action="uploadActionUrl"
               :headers="uploadHeaders"
               :show-file-list="false"
               :on-success="handleUploadSuccess"
               :on-error="handleUploadError"
               :before-upload="beforeUploadCheck"
               accept="image/jpeg,image/png,image/gif"
             >
               <img v-if="imageUrl" :src="imageUrl" class="setmeal-image-preview" alt="套餐图片"/>
               <!-- 使用引入的 Plus 图标 -->
               <el-icon v-else class="el-icon-plus uploader-icon"><Plus /></el-icon>
             </el-upload>
              <div class="el-upload__tip">只能上传jpg/png/gif文件，且不超过2MB</div>
        </el-form-item>


        <el-divider content-position="left">套餐描述</el-divider>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            rows="3"
            placeholder="请输入套餐描述 (最多200字)"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item class="button-group-form-item">
            <el-button @click="goBack"> 取消 </el-button>
            <el-button type="primary" @click="onSubmit" :loading="submitLoading"> 保存 </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 添加商品的弹窗 -->
     <el-dialog v-model="showDishDialog" title="选择商品" width="70%" :close-on-click-modal="false" top="5vh">
       <div class="dish-dialog-content">
          <el-input
             v-model="dishSearchKeyword"
             placeholder="搜索商品名称"
             clearable
             @input="onDishSearchDebounced" 
             @clear="onDishSearchClear"
             class="dish-search-input"
          >
             <template #append><el-button :icon="Search" @click="onDishSearchNow" /></template> <!-- 添加搜索图标按钮 -->
          </el-input>

           <div class="dish-selection-dialog-body">
               <el-tabs v-model="activeDishCategoryName" @tab-click="handleTabClick" class="dish-tabs">
                    <el-tab-pane
                       v-for="cat in dishCategories"
                       :key="cat.id"
                       :label="cat.name"
                       :name="cat.id"
                    >
                         <el-scrollbar height="400px" v-loading="dishLoading">
                              <el-checkbox-group v-model="checkedDishIds">
                                   <div v-for="dish in currentCategoryDishes" :key="dish.id" class="dish-checkbox-wrapper">
                                       <el-checkbox :label="dish.id" :disabled="dish.status === 0">
                                           <div class="dish-checkbox-label">
                                               <span>{{ dish.name }}</span>
                                               <span class="dish-checkbox-price">￥{{ formatPrice(dish.price) }}</span>
                                                <el-tag v-if="dish.status === 0" type="danger" size="small" effect="plain">停售</el-tag>
                                           </div>
                                       </el-checkbox>
                                   </div>
                               </el-checkbox-group>
                               <el-empty v-if="!dishLoading && currentCategoryDishes.length === 0" description="该分类下暂无在售商品" />
                               <!-- <p v-if="dishLoading" style="text-align: center; padding: 10px; color: #999;">加载中...</p> -->
                               <!-- <p v-if="!dishLoading && dishFinished" style="text-align: center; padding: 10px; color: #ccc;">没有更多商品了</p> -->
                         </el-scrollbar>
                     </el-tab-pane>
               </el-tabs>
            </div>
       </div>
       <template #footer>
         <div class="dialog-footer">
           <span class="selected-count">已选 {{ checkedDishIds.length }} 项</span>
           <el-button @click="showDishDialog = false">取消</el-button>
           <el-button type="primary" @click="confirmAddDishes">确认添加</el-button>
         </div>
       </template>
     </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'; // watch 重新引入，防抖可能需要
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus'; // 移除了 ElMessageBox
import { Plus, Search } from '@element-plus/icons-vue'; // 引入需要的图标

import { getCategoryList } from '@/api/category';
import { queryDishList } from '@/api/dish';
import { addSetmeal, editSetmeal, querySetmealById } from '@/api/setmeal';

// 不再需要 defaultImage 变量，直接在 imgPathConvert 中处理
// const defaultImage = '';

const router = useRouter();
const route = useRoute();
const setmealId = route.params.id || null;
const isEditMode = computed(() => !!setmealId);

const formRef = ref(null);
const loading = ref(false);
const submitLoading = ref(false);

const formData = reactive({
  id: setmealId,
  name: '',
  categoryId: null,
  price: '',
  image: '',
  description: '',
  status: 1,
  setmealDishes: []
});

const imageUrl = ref(''); // 图片预览 URL

// --- 文件上传相关 ---
// [!!! 重要检查点 !!!] 确认后端上传接口路径
const uploadActionUrl = computed(() => '/common/upload'); // 或 '/api/common/upload'
const uploadHeaders = computed(() => { return {}; }); // Session 模式下通常为空

// --- 分类数据 ---
const setmealCategories = ref([]);
const dishCategories = ref([]);

// --- 添加商品弹窗 ---
const showDishDialog = ref(false);
const activeDishCategoryName = ref(''); // 对应 el-tabs 的 v-model
const currentCategoryDishes = ref([]);
const dishLoading = ref(false);
const dishFinished = ref(true); // 简化，假设不分页
const selectedDishCategoryId = ref(null);
const dishSearchKeyword = ref('');
const checkedDishIds = ref([]); // 只存 ID

// --- 计算属性 ---
// selectedDishes 直接使用 formData.setmealDishes，不再需要单独的计算属性
// hasSelectedDishes 计算属性被移除，直接校验 formData.setmealDishes.length

// --- 校验规则 ---
const validatePrice = (rule, value, callback) => {
    if (value === null || value === undefined || value === '') {
        callback(); return;
    }
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || !/^\d+(\.\d{1,2})?$/.test(String(value))) {
       callback(new Error('请输入有效的金额, 最多两位小数'));
    } else {
       callback();
    }
};
const rules = reactive({
    name: [{ required: true, message: '套餐名称不能为空', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择套餐分类', trigger: 'change' }],
    price: [
        { required: true, message: '价格不能为空', trigger: 'blur' },
        { validator: validatePrice, trigger: 'blur' }
    ],
    // 校验整个商品列表是否为空
    setmealDishes: [{
        required: true,
        validator: (rule, value, callback) => {
            if (!value || value.length === 0) {
                callback(new Error('请添加套餐商品'));
            } else {
                // 可以添加更复杂的校验，比如检查份数是否都大于0
                 const validCopies = value.every(item => item.copies >= 1);
                 if (!validCopies) {
                   callback(new Error('商品份数必须大于等于1'));
                 } else {
                   callback();
                 }
            }
        },
        // 因为内部 input-number 的 change 可能不冒泡，用 blur 或 submit 时再验
        trigger: ['change', 'blur'] // 可以在删除或添加后触发
    }],
    image: [{ required: true, message: '请上传套餐图片', trigger: 'change' }]
});

// --- 方法 ---
const formatPrice = (price) => parseFloat(price || 0).toFixed(2);

// --- 防抖函数 (简单实现) ---
let searchTimeout = null;
const debounce = (func, wait = 300) => {
  return (...args) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
};

// 获取套餐分类
const fetchSetmealCategories = async () => {
   try {
       const response = await getCategoryList({ type: 2, pageSize: 1000 });
       setmealCategories.value = (response?.code === 1 && response.data) ? (response.data.records || response.data || []) : [];
   } catch (error) { console.error("获取套餐分类失败:", error); ElMessage.error('获取套餐分类异常'); }
};

// 获取商品分类 (弹窗用)
const fetchDishCategories = async () => {
   try {
       const response = await getCategoryList({ type: 1, pageSize: 1000 });
       dishCategories.value = (response?.code === 1 && response.data) ? (response.data.records || response.data || []) : [];
       if (dishCategories.value.length > 0) {
           activeDishCategoryName.value = dishCategories.value[0].id; // 默认激活第一个Tab的name(即ID)
           selectedDishCategoryId.value = dishCategories.value[0].id;
           await fetchDishes(true);
       }
   } catch (error) { console.error("获取商品分类失败:", error); ElMessage.error('获取商品分类异常');}
};

// 获取商品列表
const fetchDishes = async (reset = false) => {
    if (reset) {
       currentCategoryDishes.value = [];
       dishFinished.value = true; // 假设不分页
    }
    if (dishLoading.value) return;
    dishLoading.value = true;
    try {
        const params = {
            pageSize: 1000, // 加载全部
            categoryId: dishSearchKeyword.value ? undefined : selectedDishCategoryId.value,
            name: dishSearchKeyword.value || undefined,
            status: 1
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        const response = await queryDishList(params);
        currentCategoryDishes.value = (response?.code === 1 && Array.isArray(response.data?.records)) ? response.data.records : [];
        dishFinished.value = true; // 无论成功失败都算结束（无分页）

        // 同步勾选状态
        const currentIdsSet = new Set(currentCategoryDishes.value.map(d => d.id));
        checkedDishIds.value = formData.setmealDishes
             .map(sd => sd.dishId)
             .filter(id => currentIdsSet.has(id));

    } catch (error) { console.error("加载商品列表异常:", error); ElMessage.error('加载商品列表请求异常');}
      finally { dishLoading.value = false; }
};

// --- Dialog 内的 Tabs 和搜索 ---
const handleTabClick = (tab) => {
   const newCategoryId = tab.paneName;
   if (newCategoryId && newCategoryId !== selectedDishCategoryId.value) {
      selectedDishCategoryId.value = newCategoryId;
      dishSearchKeyword.value = '';
      fetchDishes(true);
   }
};

// 防抖的搜索处理
const onDishSearchDebounced = debounce(() => {
    selectedDishCategoryId.value = null;
    activeDishCategoryName.value = ''; // 取消Tab激活
    fetchDishes(true);
}, 500); // 500ms 防抖

// 点击搜索按钮立即搜索
const onDishSearchNow = () => {
    clearTimeout(searchTimeout); // 取消可能存在的延时任务
    selectedDishCategoryId.value = null;
    activeDishCategoryName.value = '';
    fetchDishes(true);
};

const onDishSearchClear = () => {
    dishSearchKeyword.value = '';
    if (dishCategories.value.length > 0) {
       activeDishCategoryName.value = dishCategories.value[0].id;
       selectedDishCategoryId.value = dishCategories.value[0].id;
       fetchDishes(true);
    }
};

// --- 图片处理 (Element Plus Upload 回调) ---
// [!!! 重要检查点 !!!] 确认图片下载路径是否正确
const imgPathConvert = (path) => path ? `/common/download?name=${path}` : ''; // 或 '/api/common/download?name=${path}'

const beforeUploadCheck = (rawFile) => {
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(rawFile.type)) {
    ElMessage.error('图片必须是 JPG, PNG 或 GIF 格式!'); return false;
  }
  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过 2MB!'); return false;
  }
  return true;
};

const handleUploadSuccess = (response) => { // _uploadFile 未使用
  console.log("上传成功返回:", response);
  if (response && response.code === 1) {
     formData.image = response.data;
     imageUrl.value = imgPathConvert(response.data);
     ElMessage.success('图片上传成功');
     formRef.value?.validateField('image'); // 触发校验
  } else {
     ElMessage.error(response?.msg || '图片上传失败');
     // Element Plus Upload 默认在失败时不保留文件，这里不需要手动清除 fileList
  }
};

const handleUploadError = (error) => { 
  console.error("上传失败:", error);
   let message = '图片上传失败';
   try { // 尝试解析更详细的错误信息
       const errorResponse = error?.response?.data; // axios错误常见结构
       if (errorResponse && errorResponse.msg) {
          message = errorResponse.msg;
       } else if (error.message){ // 其他错误信息
          message = error.message;
       }
   } catch(e) {
      console.warn("解析上传错误信息失败", e);
   }
   ElMessage.error(message);
};


// --- 套餐商品管理 ---
const confirmAddDishes = () => {
    const currentDishMap = new Map(currentCategoryDishes.value.map(dish => [dish.id, dish]));
    const existingDishIds = new Set(formData.setmealDishes.map(d => d.dishId));

    checkedDishIds.value.forEach(dishId => {
        if (!existingDishIds.has(dishId)) { // 只添加不存在的
            const dishToAdd = currentDishMap.get(dishId);
            if (dishToAdd) {
                formData.setmealDishes.push({
                    dishId: dishToAdd.id,
                    name: dishToAdd.name,
                    price: dishToAdd.price,
                    copies: 1
                });
            }
        }
    });
    showDishDialog.value = false;
    formRef.value?.validateField('setmealDishes');
};

const removeSelectedDish = (index) => {
    formData.setmealDishes.splice(index, 1);
    formRef.value?.validateField('setmealDishes');
};

// --- 表单提交 ---
const onSubmit = () => {
   formRef.value?.validate(async (valid) => {
      if (valid) {
         submitLoading.value = true;
         try {
            const params = {
                id: formData.id,
                name: formData.name,
                categoryId: formData.categoryId,
                price: parseFloat(formData.price),
                image: formData.image,
                description: formData.description,
                status: formData.status, // 假设是 0 或 1
                setmealDishes: formData.setmealDishes.map(d => ({
                   dishId: d.dishId,
                   copies: d.copies
                }))
            };
            console.log("最终提交的参数:", params);

            let response;
            // [!!! 重要检查点 !!!] 确认 addSetmeal/editSetmeal 对应的后端路径
             if (isEditMode.value) {
                 response = await editSetmeal(params);
             } else {
                  delete params.id; // 新增时移除 id
                  response = await addSetmeal(params);
             }

             if (response && response.code === 1) {
                ElMessage.success('操作成功！');
                goBack();
             } else {
                 ElMessage.error(response?.msg || '操作失败');
             }
         } catch (error) {
             console.error("保存套餐失败:", error);
             // 错误信息在 axios 拦截器处理
         } finally {
            submitLoading.value = false;
         }
      } else {
         ElMessage.warning('请检查表单填写是否完整且正确');
         return false;
      }
   });
};

const goBack = () => { router.push('/setmeal'); };

// --- 初始化逻辑 ---
const init = async () => {
  loading.value = true;
  await fetchSetmealCategories();

  if (isEditMode.value) {
    try {
       // [!!! 重要检查点 !!!] 确认 querySetmealById 对应的后端路径
       const response = await querySetmealById(setmealId);
       if (response?.code === 1 && response.data) {
         Object.assign(formData, {
             ...response.data,
             price: String(response.data.price), // price转回字符串给el-input
             setmealDishes: Array.isArray(response.data.setmealDishes)
               ? response.data.setmealDishes.map(d => ({
                   dishId: d.dishId,
                   name: d.name,
                   price: d.price,
                   copies: d.copies || d.number || 1 // 适配后端可能的字段名
                 }))
               : []
         });
         if (formData.image) {
           imageUrl.value = imgPathConvert(formData.image);
         }
       } else {
         ElMessage.error(response?.msg || '获取套餐详情失败'); goBack(); return;
       }
    } catch (error) {
        console.error("获取套餐详情异常:", error); ElMessage.error('获取套餐详情异常'); goBack(); return;
    }
  } else {
      // 新增时的默认值已在 reactive 中设置
  }

  // 编辑和新增都需要加载商品分类列表给弹窗
  await fetchDishCategories();
  loading.value = false;
};

onMounted(() => { init(); });

</script>

<style scoped>
/* --- 样式部分 --- */
.page-container { padding: 20px; background-color: #ffffff; }
.form-card { background-color: #fff; border-radius: 4px; padding: 24px; }
.el-divider--horizontal { margin: 24px 0; }
.full-width { width: 100%; }
.add-dish-btn { margin-bottom: 15px; }
.no-category-tip { color: #F56C6C; font-size: 12px; padding: 0 10px;} /* 调整样式 */
.no-category-tip .link { color: #409EFF; text-decoration: none; margin-left: 5px;}
.button-group-form-item { margin-top: 20px;}
.button-group-form-item .el-form-item__content { justify-content: flex-end; }

/* Uploader 样式 */
.setmeal-uploader .el-upload {
  border: 1px dashed var(--el-border-color-darker); /* 使用 Element Plus 变量 */
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
.setmeal-uploader .el-upload:hover { border-color: var(--el-color-primary); }
.uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 148px;
  height: 148px;
  display: flex; /* 垂直居中图标 */
  justify-content: center; /* 水平居中图标 */
  align-items: center; /* 垂直居中图标 */
}
.setmeal-image-preview {
  width: 148px;
  height: 148px;
  display: block;
  object-fit: cover;
}
.el-upload__tip {
    font-size: 12px;
    color: var(--el-text-color-secondary); /* 使用 Element Plus 变量 */
    margin-top: 7px;
}

/* Dialog 样式 */
.dish-dialog-content { display: flex; flex-direction: column; height: 60vh; /* 控制弹窗内容高度 */ }
.dish-search-input { margin-bottom: 15px; }
.dish-selection-dialog-body { flex-grow: 1; overflow: hidden; display: flex;}
.dish-tabs { width: 100%; display: flex; flex-direction: column;}
.dish-tabs .el-tabs__content { flex-grow: 1; overflow: hidden; padding: 0 10px; } /* 给内容区加点边距 */
.dish-tabs .el-tab-pane { height: 100%; }
.dish-tabs .el-scrollbar { /* 确保滚动条工作 */ }
.dish-checkbox-wrapper { padding: 8px 0; border-bottom: 1px solid #f0f0f0; margin-right: 10px; } /* 加右边距 */
.dish-checkbox-wrapper:last-child { border-bottom: none; }
.dish-checkbox-label { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.dish-checkbox-price { color: #E6A23C; margin-left: 10px; font-weight: 500; padding: 0 10px; }

.dialog-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e4e7ed;}
.selected-count { color: #909399; font-size: 14px; margin-left: 10px; }

</style>