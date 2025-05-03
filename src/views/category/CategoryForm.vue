<template>
    <van-form @submit="onSubmit" ref="formInstanceRef">
      <van-cell-group inset>
        <van-field
          v-model.trim="formData.name"
          name="name"
          label="分类名称"
          placeholder="请输入分类名称"
          :rules="[{ required: true, message: '分类名称不能为空' }]"
          maxlength="14"
        />
        <van-field
          v-model.number="formData.sort"
          name="sort"
          label="排序"
          type="digit"
          placeholder="请输入排序（数字，值越小越靠前）"
          :rules="[{ required: true, message: '排序不能为空' }, { validator: validateSort, message: '请输入有效的非负整数' }]"
        />
      </van-cell-group>
      <div style="margin: 25px 16px 10px;">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          {{ isEdit ? '保存修改' : '确定添加' }}
        </van-button>
        <van-button round block plain @click="onCancel" style="margin-top: 10px;">
          取消
        </van-button>
      </div>
    </van-form>
  </template>
  
  <script setup>
  import { ref, reactive, watch, defineProps, defineEmits, computed } from 'vue';
  import { showNotify } from 'vant';
  
  import { addCategory, editCategory } from '@/api/category';
  
  const props = defineProps({
    initialData: {
      type: Object,
      default: null
    },
    categoryType: {
        type: String,
        required: true
    }
  });
  
  const emit = defineEmits(['submit-success', 'cancel']);
  
  const loading = ref(false);
  const formInstanceRef = ref(null); // Ref for the form instance
  
  const formData = reactive({
    id: null,
    name: '',
    sort: null,
    type: props.categoryType
  });
  
  const isEdit = computed(() => !!formData.id);
  
  const validateSort = (val) => {
      if (val === null || val === '') return false;
      const num = Number(val);
      return Number.isInteger(num) && num >= 0;
  };
  
  watch(() => props.initialData, (newData) => {
    if (newData) {
      formData.id = newData.id;
      formData.name = newData.name;
      formData.sort = newData.sort === null ? null : Number(newData.sort);
      formData.type = String(newData.type || props.categoryType);
    } else {
      formData.id = null;
      formData.name = '';
      formData.sort = 0; // Default sort to 0 for new category
      formData.type = props.categoryType;
    }
    // Reset validation state when data changes (or modal opens)
     formInstanceRef.value?.resetValidation();
  }, { immediate: true, deep: true });
  
  const onSubmit = async () => {
    loading.value = true;
    try {
      let response;
      const params = { ...formData };
  
      if (params.sort === null || params.sort === '') {
          params.sort = 0;
      }
  
      if (isEdit.value) {
        response = await editCategory(params);
      } else {
         const addParams = { name: params.name, sort: params.sort, type: params.type };
         response = await addCategory(addParams);
      }
  
      if (response && response.code === 1) {
        emit('submit-success');
      } else {
        showNotify({ type: 'danger', message: response?.msg || '操作失败' });
      }
    } catch (error) {
      console.error("分类表单提交失败:", error);
    } finally {
      loading.value = false;
    }
  };
  
  const onCancel = () => {
    emit('cancel');
  };
  
  </script>
  
  <style scoped>
  .van-cell-group { margin-bottom: 15px; }
  :deep(.van-field__label) { width: 80px;} 
  @media (max-width: 768px) {
  .quick-actions .el-button {
    width: calc(50% - 8px);
  }
}
@media (max-width: 480px) {
  .quick-actions .el-button {
    width: 100%;
  }
}
  </style>