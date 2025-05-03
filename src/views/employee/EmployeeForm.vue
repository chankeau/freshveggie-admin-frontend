<template>
  <div class="page-container employee-form">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑员工信息' : '新增员工' }}</span>
        </div>
      </template>

      <!-- 使用 El-Form -->
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" v-loading="loading">
        <el-form-item label="员工账号" prop="username">
          <el-input
            v-model.trim="formData.username"
            placeholder="请输入登录账号"
            :readonly="isEdit"
            maxlength="20"
            clearable
          />
        </el-form-item>
        <el-form-item label="员工姓名" prop="name">
          <el-input
            v-model.trim="formData.name"
            placeholder="请输入员工姓名"
            maxlength="12"
            clearable
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model.trim="formData.phone"
            type="tel"
            placeholder="请输入员工手机号"
            maxlength="11"
            clearable
          />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <!-- 使用 El-Radio-Group -->
          <el-radio-group v-model="formData.sex">
            <el-radio label="1">男</el-radio>
            <el-radio label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="身份证号" prop="idNumber">
          <el-input
            v-model.trim="formData.idNumber"
            placeholder="请输入身份证号"
            maxlength="18"
            clearable
          />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" @click="onSubmit" :loading="submitLoading">保存</el-button>
          <el-button
            v-if="!isEdit"
            type="success"
            @click="onSubmit('goAnd')"
            :loading="submitLoading"
          >
            保存并继续添加
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// --- 导入 Element Plus 相关 ---
import { ElMessage, ElForm, ElInput, ElRadioGroup, ElRadio, ElButton, ElCard, ElFormItem } from 'element-plus';
import { addEmployee, editEmployee, queryEmployeeById } from '@/api/employee';
// --- 导入 Element Plus 的校验规则或自定义校验函数 ---
// 假设 validate.js 中的函数返回 true 或错误对象/消息
import { checkUserName, checkName, checkPhone, validID } from '@/utils/validate';

const router = useRouter();
const route = useRoute();
const employeeId = route.params.id || null;
const isEdit = computed(() => !!employeeId);

const formRef = ref(null); // 用于引用 el-form 实例
const submitLoading = ref(false);
const loading = ref(false); // 用于加载初始数据的 loading

const formData = reactive({
  id: employeeId,
  username: '',
  name: '',
  phone: '',
  sex: '1', // Element Radio label 默认是 string
  idNumber: ''
});

// --- Element Plus 表单校验规则 ---
const formRules = reactive({
  username: [
    { required: true, message: '账号不能为空', trigger: 'blur' },
    { validator: (rule, value, callback) => checkUserName(value) ? callback() : callback(new Error('账号长度应是3-20位')), trigger: 'blur' }
  ],
  name: [
    { required: true, message: '姓名不能为空', trigger: 'blur' },
    { validator: (rule, value, callback) => checkName(value) ? callback() : callback(new Error('姓名长度应是1-12位')), trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '手机号不能为空', trigger: 'blur' },
    { validator: (rule, value, callback) => checkPhone(value) ? callback() : callback(new Error('手机号格式不正确')), trigger: 'blur' }
  ],
  sex: [ { required: true, message: '请选择性别', trigger: 'change' } ],
  idNumber: [
    { required: true, message: '身份证号不能为空', trigger: 'blur' },
    { validator: (rule, value, callback) => validID(value) ? callback() : callback(new Error('身份证号格式不正确')), trigger: 'blur' }
  ]
});


const init = async () => {
  if (isEdit.value) {
    loading.value = true;
    try {
      const response = await queryEmployeeById(employeeId);
      if (response && response.code === 1) {
        const data = response.data;
        formData.username = data.username;
        formData.name = data.name;
        formData.phone = data.phone;
        formData.sex = String(data.sex); // 确保是字符串
        formData.idNumber = data.idNumber;
        formData.id = data.id;
      } else {
         // --- 使用 ElMessage 替换 showNotify ---
        ElMessage.error(response?.msg || '获取员工信息失败');
        goBack();
      }
    } catch (error) {
       console.error("获取员工信息失败:", error);
       // --- 使用 ElMessage 替换 showNotify ---
       // ElMessage.error('请求员工信息出错'); // 错误已在拦截器处理
       goBack();
    } finally {
        loading.value = false;
    }
  } else {
     // 新增模式重置 (如果需要的话)
     Object.assign(formData, {
         id: null, username: '', name: '', phone: '', sex: '1', idNumber: ''
     });
  }
};

const onSubmit = async (mode = '') => {
  if (!formRef.value) return;
  submitLoading.value = true;

  try {
    // 使用 Element Plus Form 的 validate 方法
    await formRef.value.validate();

    const params = { ...formData };
    // params.sex = Number(params.sex); // 如果后端需要数字

    let response;
    if (isEdit.value) {
      response = await editEmployee(params);
    } else {
      delete params.id;
      response = await addEmployee(params);
    }

    if (response && response.code === 1) {
      // --- 使用 ElMessage 替换 showToast ---
      ElMessage.success(`员工${isEdit.value ? '修改' : '添加'}成功！`);
      if (mode === 'goAnd' && !isEdit.value) {
        formRef.value.resetFields(); // 重置表单和校验状态
        // 可能需要手动设置 sex 的默认值，因为 resetFields 可能清空所有
        formData.sex = '1';
      } else {
        goBack();
      }
    } else {
      // --- 使用 ElMessage 替换 showNotify ---
      ElMessage.error(response?.msg || '操作失败');
    }
  } catch (validationError) {
    // validate 失败会自动显示错误，这里可以不提示或给通用提示
    if (validationError) { // 确保是校验错误而非 API 错误
        console.log('表单校验失败:', validationError);
       // ElMessage.warning('请检查表单填写是否正确');
    }
  } finally {
    submitLoading.value = false;
  }
};

const goBack = () => { router.push('/employee'); };

onMounted(() => {
  init();
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}
.card-header {
  font-weight: bold;
}
/* 可以根据需要调整表单宽度或布局 */
.el-form {
  max-width: 600px; /* 限制最大宽度 */
}
</style>