<template>
  <div class="page-container category-management">
    <div class="container">
      <!-- 操作栏 -->
      <div class="tableBar">
        <el-button type="primary" @click="handleAdd('1')" :icon="Plus">
          新增商品分类
        </el-button>
        <el-button type="primary" @click="handleAdd('2')" :icon="Plus">
          新增套餐分类
        </el-button>
      </div>

      <!-- 响应式表格容器 -->
      <div class="table-responsive">
        <el-table 
          :data="tableData" 
          stripe 
          border 
          class="tableBox"
          v-loading="loading"
          style="width: 100%;"
        >
          <el-table-column 
            prop="name" 
            label="分类名称" 
            min-width="150"
            data-label="分类名称"
          ></el-table-column>
          <el-table-column 
            prop="type" 
            label="分类类型" 
            width="150"
            data-label="分类类型"
          >
            <template #default="{ row }">
              <span>{{ row.type == '1' ? '商品分类' : '套餐分类' }}</span>
            </template>
          </el-table-column>
          <el-table-column 
            prop="updateTime" 
            label="操作时间" 
            width="180"
            data-label="操作时间"
          >
            <template #default="{ row }">
              {{ formatDateTime(row.updateTime) }}
            </template>
          </el-table-column>
          <el-table-column 
            prop="sort" 
            label="排序" 
            width="100"
            data-label="排序"
          ></el-table-column>
          <el-table-column 
            label="操作" 
            width="160" 
            align="center" 
            fixed="right"
            data-label="操作"
          >
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEdit(row)">
                修改
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无数据" />
          </template>
        </el-table>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        class="pageList"
        :page-sizes="[10, 20, 30, 50]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        v-model:current-page="currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
      ></el-pagination>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="35%"
      :before-close="handleCloseDialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        style="padding-right: 20px;"
      >
        <el-form-item label="分类名称：" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入分类名称"
            maxlength="14"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="排序：" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" controls-position="right" placeholder="请输入排序" style="width: 100%"/>
           <div class="el-form-item__tip">数字越小排序越靠前</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取 消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确 定</el-button>
          <!-- '保存并继续添加' 逻辑可以根据需要添加 -->
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { getCategoryPage, addCategory, editCategory, deleteCategory } from '@/api/category'; // 从 api 文件导入

// --- 分页和加载状态 ---
const loading = ref(true);
const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// --- 弹窗状态和表单 ---
const dialogVisible = ref(false);
const submitting = ref(false);
const dialogTitle = ref('');
const currentAction = ref('add'); // 'add' or 'edit'
const dataFormRef = ref(null); // 表单引用
const formData = reactive({
  id: null,
  name: '',
  sort: 0,
  type: '1', // 默认商品分类，由 handleAdd 动态设置
});
const formRules = reactive({
  name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
});

// --- 方法 ---
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-';
  try {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  } catch (e) { return dateTimeStr; }
};

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const params = { page: currentPage.value, pageSize: pageSize.value };
    const response = await getCategoryPage(params); // 调用分页 API
    if (response && response.code === 1) {
      tableData.value = response.data.records || [];
      total.value = response.data.total || 0;
    } else {
      ElMessage.error(response?.msg || '获取分类列表失败');
    }
  } catch (error) {
    console.error("获取分类列表异常:", error);
    ElMessage.error('获取分类列表时发生错误');
  } finally {
    loading.value = false;
  }
};

// 新增按钮点击
const handleAdd = (type) => {
  resetForm(); // 重置表单
  currentAction.value = 'add';
  formData.type = type; // 设置分类类型
  dialogTitle.value = type === '1' ? '新增商品分类' : '新增套餐分类';
  dialogVisible.value = true;
};

// 编辑按钮点击
const handleEdit = (row) => {
  resetForm();
  currentAction.value = 'edit';
  dialogTitle.value = '修改分类';
  // 将行数据填充到表单，注意类型转换
  formData.id = row.id;
  formData.name = row.name;
  formData.sort = row.sort === null ? 0 : Number(row.sort); // 后端 sort 可能是 null
  formData.type = String(row.type); // 确保 type 是字符串
  dialogVisible.value = true;
};

// 删除按钮点击
const handleDelete = (id) => {
  ElMessageBox.confirm('此操作将永久删除该分类, 是否继续?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        const response = await deleteCategory(id); // 调用删除 API
        if (response && response.code === 1) {
          ElMessage.success('删除成功！');
          // 智能刷新：如果删除的是当前页最后一条，且不在第一页，则加载前一页
           if (tableData.value.length === 1 && currentPage.value > 1) {
              currentPage.value--;
            }
           fetchData(); // 刷新数据
        } else {
          ElMessage.error(response?.msg || '删除失败');
        }
      } catch (error) {
        console.error("删除分类异常:", error);
        ElMessage.error('删除分类请求失败');
      }
    })
    .catch(() => { ElMessage.info('已取消删除'); });
};

// 弹窗关闭前回调
const handleCloseDialog = () => {
  resetForm();
  dialogVisible.value = false;
};

// 重置表单
const resetForm = () => {
  formData.id = null;
  formData.name = '';
  formData.sort = 0;
  formData.type = '1'; // 重置回默认商品分类
  dataFormRef.value?.resetFields(); // 清除校验状态
};

// 提交表单
const submitForm = async () => {
  if (!dataFormRef.value) return;
  await dataFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        let response;
        const params = { ...formData };
         // sort 为 0 或 null 时后端可能期望数字 0，如果后端不允许 null 需要前端处理
         if (params.sort === null || params.sort === undefined) {
            params.sort = 0;
         }

        if (currentAction.value === 'edit') {
          response = await editCategory(params); // 调用编辑 API
        } else {
           const addParams = { name: params.name, sort: params.sort, type: params.type };
           response = await addCategory(addParams); // 调用新增 API
        }

        if (response && response.code === 1) {
          ElMessage.success(currentAction.value === 'edit' ? '修改成功！' : '添加成功！');
          dialogVisible.value = false;
          fetchData(); // 成功后刷新列表
        } else {
          ElMessage.error(response?.msg || '操作失败');
        }
      } catch (error) {
        console.error("提交分类表单异常:", error);
         ElMessage.error('提交请求失败');
      } finally {
        submitting.value = false;
      }
    } else {
      console.log('表单校验失败');
      return false;
    }
  });
};

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1; // 重置到第一页
  fetchData();
};

// 当前页改变
const handleCurrentChange = (val) => {
  fetchData(val); // 加载指定页
};

// 组件挂载后加载数据
onMounted(() => {
  fetchData();
});
</script>


<style scoped lang="scss">
.page-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 12px;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.tableBar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    .el-button {
      width: 100%;
      margin-left: 0 !important;
    }
  }
}

/* 响应式表格容器 */
.table-responsive {
  overflow-x: auto;
  
  @media (max-width: 768px) {
    .el-table {
      min-width: 100%;
      display: table;

      // 隐藏表头
      ::v-deep .el-table__header-wrapper {
        display: none;
      }

      // 移动端卡片布局
      ::v-deep .el-table__body {
        display: block;
        width: 100%;

        tr {
          display: flex;
          flex-direction: column;
          border: 1px solid #ebeef5;
          margin-bottom: 12px;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);

          td {
            display: flex;
            align-items: center;
            min-height: 48px;
            padding: 8px 16px;
            border: none !important;

            // 添加数据标签
            &::before {
              content: attr(data-label);
              width: 80px;
              flex-shrink: 0;
              font-weight: 500;
              color: #606266;
              margin-right: 12px;
            }

            // 操作列特殊处理
            &.el-table__cell:last-child {
              justify-content: flex-end;
              border-top: 1px dashed #eee !important;
              padding-top: 12px;
              margin-top: 8px;

              &::before {
                content: none;
              }
            }
          }
        }
      }
    }
  }
}

.tableBox {
  // 默认表格样式
  ::v-deep .el-table__cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    @media (max-width: 768px) {
      white-space: normal;
      overflow: visible;
    }
  }

  // 列宽响应式控制
  @media (max-width: 1024px) {
    ::v-deep .el-table__header th:nth-child(1),
    ::v-deep .el-table__body td:nth-child(1) {
      width: 200px;
      min-width: 200px;
    }
  }
}

.pageList {
  text-align: right;
  margin-top: 20px;

  @media (max-width: 768px) {
    :deep(*) {
      font-size: 12px;
    }
    
    :deep(.btn-prev),
    :deep(.btn-next),
    :deep(.el-pager li) {
      min-width: 28px;
      height: 28px;
      line-height: 28px;
    }
  }
}

/* 美化滚动条 */
.table-responsive::-webkit-scrollbar {
  height: 8px;
  background-color: #f5f5f5;
}

.table-responsive::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 4px;
  &:hover {
    background-color: #a8a8a8;
  }
}

.el-form-item__tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

@media (max-width: 768px) {
  .el-dialog {
    width: 90% !important;
  }
}
</style>