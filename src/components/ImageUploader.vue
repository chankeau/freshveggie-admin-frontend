<template>
  <div class="image-uploader-container">
    <el-upload
      v-model:file-list="internalFileList"
      :class="uploaderClasses"  
      :action="uploadAction" 
      :http-request="customHttpRequest" 
      list-type="picture-card" 
      :limit="1" 
      :accept="ALLOWED_MIME_TYPES_STRING" 
      :show-file-list="true" 
      :before-upload="handleBeforeUpload" 
      :on-exceed="handleExceed" 
      :on-remove="handleRemove" 
    >
      <el-icon><Plus /></el-icon> 
    </el-upload>
    <div v-if="errorTip" class="upload-error-tip">{{ errorTip }}</div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { ElMessage, ElNotification, ElUpload, ElIcon } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import apiClient from '@/plugins/axios';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_MIME_TYPES_STRING = ALLOWED_MIME_TYPES.join(',');

const props = defineProps({
  modelValue: { type: String, default: '' },
  uploadAction: { type: String, default: '/api/common/upload' },
  previewBaseUrl: { type: String, required: true }
});

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-fail', 'delete-success']);

// 组件内部维护的文件列表
const internalFileList = ref([]);
const errorTip = ref('');

const imgPathConvert = (filename) => {
    return filename ? `${props.previewBaseUrl}${filename}` : '';
};

// 同步外部v-model与内部列表
watch(() => props.modelValue, (newFilename) => {
  const currentInternalFile = internalFileList.value.length > 0 ? internalFileList.value[0] : null;
  const currentInternalName = currentInternalFile?.name; 

  if (newFilename) {
    if (!currentInternalFile || currentInternalFile.status !== 'success' || currentInternalName !== newFilename) {
       internalFileList.value = [{
         name: newFilename, 
         url: imgPathConvert(newFilename), 
         status: 'success', 
         uid: Date.now() 
       }];
       errorTip.value = ''; 
    }
  } else {
    if (currentInternalFile) {
      internalFileList.value = [];
    }
  }
}, { immediate: true }); 

// 上传前文件校验
const handleBeforeUpload = (rawFile) => {
  errorTip.value = ''; 

  if (!ALLOWED_MIME_TYPES.includes(rawFile.type)) {
    const msg = `请上传 ${ALLOWED_MIME_TYPES.map(t=>t.split('/')[1]).join('/')} 格式图片`;
    ElNotification({ title: '格式错误', message: msg, type: 'error' });
    errorTip.value = msg;
    return false; 
  }

  if (rawFile.size > MAX_FILE_SIZE_BYTES) {
    const msg = `图片大小不能超过 ${MAX_FILE_SIZE_MB}MB`;
    ElNotification({ title: '大小超限', message: msg, type: 'error' });
    errorTip.value = msg;
    return false; 
  }

  return true; 
};

// 自定义上传逻辑
const customHttpRequest = async (options) => {
  const { file, onSuccess, onError } = options;
  const formData = new FormData();
  formData.append('file', file); 

  try {
    const fileInList = internalFileList.value.find(f => f.uid === file.uid);
    if (fileInList) {
       fileInList.status = 'uploading';
    } else {
         internalFileList.value = [{ name: file.name, status: 'uploading', uid: file.uid, raw: file }];
    }

    const response = await apiClient.post(props.uploadAction, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response && response.code === 1) {
      const backendFilename = response.data; 
      onSuccess(response); 

       const finalFileIndex = internalFileList.value.findIndex(f => f.uid === file.uid);
       if (finalFileIndex > -1) {
           internalFileList.value[finalFileIndex] = {
               ...internalFileList.value[finalFileIndex], 
               name: backendFilename, 
               url: imgPathConvert(backendFilename), 
               status: 'success',
           };
       } else { 
           internalFileList.value = [{ name: backendFilename, url: imgPathConvert(backendFilename), status: 'success', uid: file.uid }];
       }

      emit('update:modelValue', backendFilename); 
      emit('upload-success', backendFilename);
      ElMessage.success('上传成功');
      errorTip.value = '';
    } else {
      throw new Error(response?.msg || '上传接口返回失败');
    }
  } catch (error) {
    console.error("上传图片失败:", error);
    const errorMessage = `上传失败: ${error.message || '请重试'}`;
    onError(error); 

     const failedFileIndex = internalFileList.value.findIndex(f => f.uid === file.uid);
     if (failedFileIndex > -1) {
         internalFileList.value.splice(failedFileIndex, 1);
     }

    emit('upload-fail', error); 
    errorTip.value = errorMessage; 
    ElNotification({ title: '上传失败', message: errorMessage, type: 'error' }); 

    emit('update:modelValue', '');
  }
};

const handleExceed = () => {
  ElMessage.warning(`只能上传 1 个文件`);
};

// 处理文件移除
const handleRemove = () => {
  emit('update:modelValue', ''); 
  emit('delete-success');
  errorTip.value = ''; 
  return true; 
};

// 动态计算class来隐藏上传按钮
const uploaderClasses = computed(() => {
  return [
    'element-image-uploader',
    internalFileList.value.length >= 1 ? 'hide-trigger' : ''
  ].filter(Boolean).join(' ');
});

</script>

<style lang="scss" scoped>
.image-uploader-container {
  width: fit-content;
}

.element-image-uploader {
  :deep(.el-upload--picture-card) {
    width: 120px;
    height: 120px;
    border: 1px dashed var(--el-border-color-darker);
    border-radius: 6px;
    background-color: var(--el-fill-color-lighter);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.3s ease;
    &:hover {
      border-color: var(--el-color-primary);
    }
    .el-icon {
      font-size: 28px;
      color: var(--el-text-color-secondary);
    }
  }

  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 120px;
    height: 120px;
    border-radius: 6px;
    margin: 0;
    border: 1px solid var(--el-border-color);
    img {
        object-fit: cover;
        width: 100%;
        height: 100%;
    }
  }

  &.hide-trigger :deep(.el-upload--picture-card) {
     display: none;
  }
}


.upload-error-tip {
  color: var(--el-color-danger);
  font-size: 12px;
  margin-top: 5px;
  line-height: 1.2;
}
</style>