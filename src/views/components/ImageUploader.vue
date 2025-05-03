<template>
  <div class="image-uploader-container">
    <!-- Element Plus 上传组件，配置图片卡片样式、单文件限制和自定义请求。 -->
    <el-upload
      v-model:file-list="internalFileList"
      :class="uploaderClasses"
      action="#" 
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
    <!-- 显示特定的校验或上传错误提示。 -->
    <div v-if="errorTip" class="upload-error-tip">{{ errorTip }}</div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { ElMessage, ElNotification, ElUpload, ElIcon } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import apiClient from '@/plugins/axios'; // 引入配置好的 Admin Axios 实例

// 定义允许的文件类型和最大大小常量。
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_MIME_TYPES_STRING = ALLOWED_MIME_TYPES.join(',');

// 定义组件接收的属性，包括 v-model 绑定的文件名和图片预览的基础URL。
const props = defineProps({
  modelValue: { type: String, default: '' },
  previewBaseUrl: { type: String, required: true }
});

// 定义组件触发的事件，用于 v-model 更新和状态通知。
const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-fail', 'delete-success']);

// 内部状态：el-upload 需要的文件列表和错误提示信息。
const internalFileList = ref([]);
const errorTip = ref('');

// 计算属性：根据文件列表长度动态添加 CSS 类以隐藏上传触发器。
const uploaderClasses = computed(() => {
  return ['element-image-uploader', internalFileList.value.length >= 1 ? 'hide-trigger' : ''].filter(Boolean).join(' ');
});

// 辅助函数：根据后端文件名和基础URL构建完整的图片预览URL。
const getPreviewUrl = (filename) => {
  if (filename && props.previewBaseUrl) {
    const baseUrl = props.previewBaseUrl.endsWith('/') ? props.previewBaseUrl : props.previewBaseUrl + '/';
    const finalFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    // 注意：基础URL应该包含下载路径，例如 '/api/common/download?name='
    // 如果 previewBaseUrl 只是域名或路径前缀，这里需要调整
    // 假设 previewBaseUrl 类似 'http://localhost:9000/api/common/download?name='
    return `${baseUrl}${finalFilename}`;
    // 或者如果 previewBaseUrl 只是 'http://localhost:9000'
    // return `${baseUrl}/api/common/download?name=${finalFilename}`;
  }
  return '';
};

// 监听外部 v-model 变化，同步内部文件列表以正确显示图片。
watch(() => props.modelValue, (newFilename) => {
  const currentInternalFile = internalFileList.value.length > 0 ? internalFileList.value[0] : null;

  if (newFilename) {
    // 如果外部传入文件名且内部列表需要更新，则创建文件对象以显示预览。
    if (!currentInternalFile || currentInternalFile.status !== 'success' || currentInternalFile.name !== newFilename) {
       console.log(`ImageUploader: Syncing internal list with new modelValue: ${newFilename}`);
      internalFileList.value = [{
        name: newFilename,
        url: getPreviewUrl(newFilename), // 生成预览 URL
        status: 'success',
        uid: Date.now() + Math.random()
      }];
      errorTip.value = '';
    }
  } else {
    // 如果外部文件名清空，则清空内部列表。
    if (currentInternalFile) {
      console.log('ImageUploader: modelValue cleared, clearing internal list.');
      internalFileList.value = [];
    }
  }
}, { immediate: true });

// 上传前的钩子：校验文件类型和大小。
const handleBeforeUpload = (rawFile) => {
  errorTip.value = '';
  if (!ALLOWED_MIME_TYPES.includes(rawFile.type)) {
    const msg = `不支持的文件格式。请上传 ${ALLOWED_MIME_TYPES.map(t => t.split('/')[1]).join('/')} 格式的图片。`;
    ElNotification({ title: '格式错误', message: msg, type: 'error' });
    errorTip.value = msg;
    return false;
  }
  if (rawFile.size > MAX_FILE_SIZE_BYTES) {
    const msg = `图片大小不能超过 ${MAX_FILE_SIZE_MB}MB。`;
    ElNotification({ title: '大小超限', message: msg, type: 'error' });
    errorTip.value = msg;
    return false;
  }
  console.log('ImageUploader: File validation passed for:', rawFile.name);
  return true;
};

// 自定义 HTTP 请求：使用 Axios 发送上传请求。
const customHttpRequest = async (options) => {
  const { file, onSuccess, onError, onProgress } = options;
  console.log(`ImageUploader: Starting custom HTTP request for: ${file.name}`);
  const formData = new FormData();
  formData.append('file', file);

  let fileEntry = internalFileList.value.find(f => f.uid === file.uid);
   if (fileEntry) {
     fileEntry.status = 'uploading';
   } else {
     internalFileList.value = [{ name: file.name, status: 'uploading', uid: file.uid, raw: file, url: '' }];
     fileEntry = internalFileList.value[0];
   }

  try {
    // *** 关键修改：因为 Axios 实例没有 baseURL 了，这里需要写完整的目标路径（相对于 dev server）***
    console.log('[上传组件] 发起上传请求到 /api/common/upload (Full path for proxy)');
    const responseData = await apiClient.post('/api/common/upload', formData, { // <--- 使用 /api 开头的完整路径
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && typeof onProgress === 'function') {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({ percent: percentCompleted });
          if(fileEntry) fileEntry.percentage = percentCompleted;
        }
      }
    });

    // --- Success Handling (与上个版本相同，假设拦截器返回 R 对象) ---
    console.log('ImageUploader: API Response received (likely processed by interceptor):', responseData);
    if (responseData && responseData.data) {
      const backendFilename = responseData.data;
      onSuccess(responseData);
      const finalFileIndex = internalFileList.value.findIndex(f => f.uid === file.uid);
      const updatedFileEntry = { /* ... */ name: backendFilename, url: getPreviewUrl(backendFilename), status: 'success', uid: file.uid };
      if (finalFileIndex > -1) internalFileList.value.splice(finalFileIndex, 1, updatedFileEntry);
      else internalFileList.value = [updatedFileEntry];
      emit('update:modelValue', backendFilename);
      emit('upload-success', backendFilename);
      ElMessage.success('图片上传成功');
      errorTip.value = '';
    } else {
      throw new Error('上传失败：服务器未返回有效文件名');
    }

  } catch (error) {
    // --- Error Handling (与上个版本相同) ---
    console.error("ImageUploader: Upload request failed catch block:", error);
    const backendErrorMessage = error?.response?.data?.msg || error?.message;
    const networkErrorMessage = error?.message;
    const userFriendlyMessage = backendErrorMessage || networkErrorMessage || '上传时发生未知错误';
    onError(error);
    const failedFileIndex = internalFileList.value.findIndex(f => f.uid === file.uid);
    if (failedFileIndex > -1) internalFileList.value.splice(failedFileIndex, 1);
    emit('upload-fail', error);
    errorTip.value = `上传失败: ${userFriendlyMessage}`;
    // 只有在非401登出时才显示通知，因为401登出拦截器已经提示过了
    if (error?.response?.status !== 401 || router.currentRoute.value.name === 'AdminLogin') {
        ElNotification({ title: '上传失败', message: userFriendlyMessage, type: 'error' });
    }
    emit('update:modelValue', '');
  }
};

// 文件超出限制时的处理函数。
const handleExceed = () => {
  ElMessage.warning(`抱歉，一次只能上传 1 张图片`);
};

// 用户移除文件时的处理函数。
const handleRemove = () => {
  console.log('ImageUploader: File removed by user.');
  emit('update:modelValue', ''); // 清空 v-model
  emit('delete-success'); // 触发删除成功事件
  errorTip.value = '';
  // 注意：el-upload 会自动处理 internalFileList 的移除
  return true; // 允许移除
};

</script>

<style lang="scss" scoped>
.image-uploader-container {
  width: fit-content;
  position: relative;
}

.element-image-uploader {
  // 深度选择器样式：定制上传触发按钮和预览图的大小及样式。
  :deep(.el-upload--picture-card),
  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 120px;
    height: 120px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0; // 移除默认间距
  }
  :deep(.el-upload--picture-card) {
      background-color: var(--el-fill-color-lighter);
      border: 1px dashed var(--el-border-color-darker);
      cursor: pointer;
      &:hover { border-color: var(--el-color-primary); }
      .el-icon { font-size: 28px; color: var(--el-text-color-secondary); }
  }
   :deep(.el-upload-list--picture-card .el-upload-list__item) {
      border: 1px solid var(--el-border-color);
      img { object-fit: cover; width: 100%; height: 100%; display: block; }
   }

  // 当文件达到限制时，隐藏上传触发器。
  &.hide-trigger :deep(.el-upload--picture-card) {
    display: none;
  }
}

// 错误提示的样式。
.upload-error-tip {
  color: var(--el-color-danger);
  font-size: 12px;
  margin-top: 5px;
  line-height: 1.2;
  max-width: 120px;
  word-wrap: break-word;
}
</style>