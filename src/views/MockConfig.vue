<template>
  <div class="mock-config">
    <h2>Mock响应配置</h2>

    <!-- 筛选表单 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="节点筛选">
        <el-select 
          v-model="filterNodeId" 
          placeholder="请选择节点" 
          clearable
          filterable
          @change="handleFilterChange"
        >
          <el-option
            v-for="node in nodeOptions"
            :key="node.nodeId"
            :label="node.nodeName"
            :value="node.nodeId"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="primary" @click="handleAdd">新增Mock配置</el-button>
      </el-form-item>
    </el-form>

    <!-- Mock配置表格 -->
    <el-table :data="mockList" v-loading="loading" style="width: 100%">
      <el-table-column label="场景名称" min-width="150">
        <template #default="scope">
          {{ scope.row.caseName }}
        </template>
      </el-table-column>

      <el-table-column label="所属节点" min-width="150">
        <template #default="scope">
          {{ getNodeName(scope.row.nodeId) }}
        </template>
      </el-table-column>

      <el-table-column label="场景描述" min-width="200">
        <template #default="scope">
          {{ scope.row.caseDesc || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="Mock响应" min-width="200">
        <template #default="scope">
          <json-preview-cell 
            :content="scope.row.mockResponse" 
            @click="jsonViewer.open($event, 'Mock响应数据')"
          />
        </template>
      </el-table-column>

      <el-table-column label="是否启用" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.enabled === 1 ? 'success' : 'info'">
            {{ scope.row.enabled === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" width="160" align="center">
        <template #default="scope">
          {{ scope.row.createTime || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      @size-change="pagination.handleSizeChange"
      @current-change="pagination.handleCurrentChange"
      :current-page="pagination.pageNum.value"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagination.pageSize.value"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total.value"
      style="margin-top: 20px; text-align: right;"
    ></el-pagination>

    <!-- 编辑对话框 -->
    <el-dialog
      :title="dialog.title.value"
      :visible.sync="dialog.visible.value"
      width="700px"
      @close="dialog.close"
    >
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-width="120px"
      >
        <el-form-item label="所属节点" prop="nodeId">
          <el-select 
            v-model="form.nodeId" 
            placeholder="请选择节点"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="node in nodeOptions"
              :key="node.nodeId"
              :label="node.nodeName"
              :value="node.nodeId"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="场景名称" prop="caseName">
          <el-input 
            v-model="form.caseName" 
            placeholder="请输入场景名称，如：成功场景、失败场景"
          ></el-input>
        </el-form-item>

        <el-form-item label="场景描述">
          <el-input
            v-model="form.caseDesc"
            type="textarea"
            :rows="2"
            placeholder="请输入Mock场景描述"
          ></el-input>
        </el-form-item>

        <el-form-item label="Mock响应" prop="mockResponse">
          <el-input
            v-model="form.mockResponse"
            type="textarea"
            :rows="8"
            placeholder='请输入JSON格式的Mock响应数据'
          ></el-input>
        </el-form-item>

        <el-form-item label="是否启用">
          <el-switch 
            v-model="form.enabled"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          ></el-switch>
        </el-form-item>
      </el-form>

      <div slot="footer">
        <el-button @click="dialog.close">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>

    <!-- JSON查看器 -->
    <json-viewer-dialog
      :visible="jsonViewer.visible.value"
      :title="jsonViewer.title.value"
      :raw-content="jsonViewer.rawContent.value"
      :parsed-json="jsonViewer.parsedJson.value"
      :is-xml="jsonViewer.isXml.value"
      @close="jsonViewer.close"
      @copy="jsonViewer.copy"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { MessageBox } from 'element-ui';
import { getMockConfigList, createMockConfig, updateMockConfig, deleteMockConfig } from '@/api/mock';
import { getNodeListUnpaged } from '@/api/workflownode';
import { usePagination } from '@/composables/usePagination';
import { useTableLoading } from '@/composables/useTableLoading';
import { useDialog } from '@/composables/useDialog';
import { useJsonViewer } from '@/composables/useJsonViewer';
import JsonViewerDialog from '@/components/common/JsonViewerDialog.vue';
import JsonPreviewCell from '@/components/common/JsonPreviewCell.vue';

export default {
  name: 'MockConfig',
  components: {
    JsonViewerDialog,
    JsonPreviewCell
  },
  setup() {
    const mockList = ref([]);
    const nodeOptions = ref([]);
    const nodeMap = ref(new Map());
    const filterNodeId = ref(null);
    const formRef = ref(null);

    const { loading, withLoading } = useTableLoading();
    const dialog = useDialog();
    const jsonViewer = useJsonViewer();

    const form = reactive({
      mockId: null,
      nodeId: null,
      caseName: '',
      caseDesc: '',
      mockResponse: '',
      enabled: 1
    });

    const validateJson = (rule, value, callback) => {
      if (!value || value.trim() === '') {
        callback();
        return;
      }
      try {
        JSON.parse(value);
        callback();
      } catch (error) {
        callback(new Error('请输入有效的JSON格式'));
      }
    };

    const rules = {
      nodeId: [
        { required: true, message: '请选择节点', trigger: 'change' }
      ],
      caseName: [
        { required: true, message: '请输入场景名称', trigger: 'blur' }
      ],
      mockResponse: [
        { required: true, message: '请输入Mock响应数据', trigger: 'blur' },
        { validator: validateJson, trigger: 'blur' }
      ]
    };

    const fetchData = async () => {
      await withLoading(async () => {
        const params = {
          nodeId: filterNodeId.value || undefined,
          pageNum: pagination.pageNum.value,
          pageSize: pagination.pageSize.value
        };

        const response = await getMockConfigList(params);
        if (response.status === 200 && response.data.code === '200') {
          const pageList = response.data.rsp;
          mockList.value = pageList.rows || [];
          pagination.total.value = pageList.total || 0;
        }
      });
    };

    const pagination = usePagination({ fetchData });

    const fetchNodeList = async () => {
      try {
        const response = await getNodeListUnpaged();
        if (response.status === 200 && response.data.code === '200') {
          nodeOptions.value = response.data.rsp || [];
          const map = new Map();
          nodeOptions.value.forEach(node => {
            map.set(node.nodeId, node.nodeName);
          });
          nodeMap.value = map;
          
          await fetchData();
        }
      } catch (error) {
        console.error('获取节点列表失败:', error);
      }
    };

    const getNodeName = (nodeId) => {
      return nodeMap.value.get(nodeId) || '未知节点';
    };

    const handleFilterChange = () => {
      pagination.pageNum.value = 1;
      fetchData();
    };

    const resetFilters = () => {
      filterNodeId.value = null;
      pagination.pageNum.value = 1;
      fetchData();
    };

    const handleAdd = () => {
      resetForm();
      dialog.open('新增Mock配置');
    };

    const handleEdit = (row) => {
      Object.assign(form, {
        mockId: row.mockId,
        nodeId: row.nodeId,
        caseName: row.caseName,
        caseDesc: row.caseDesc || '',
        mockResponse: row.mockResponse || '',
        enabled: row.enabled !== undefined ? row.enabled : 1
      });
      dialog.open('编辑Mock配置');
    };

    const handleDelete = async (row) => {
      try {
        await MessageBox.confirm(`确定要删除Mock配置 "${row.caseName}" 吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        await deleteMockConfig(row.mockId);
        await fetchData();
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error);
        }
      }
    };

    const resetForm = () => {
      formRef.value?.resetFields();
      Object.assign(form, {
        mockId: null,
        nodeId: null,
        caseName: '',
        caseDesc: '',
        mockResponse: '',
        enabled: 1
      });
    };

    const submitForm = async () => {
      const valid = await formRef.value.validate().catch(() => false);
      if (!valid) return;

      try {
        const submitData = { ...form };
        
        // 空字符串转null
        if (!submitData.caseDesc || submitData.caseDesc.trim() === '') {
          submitData.caseDesc = null;
        }

        let response;
        if (submitData.mockId) {
          response = await updateMockConfig(submitData);
        } else {
          delete submitData.mockId;
          response = await createMockConfig(submitData);
        }

        if (response.status === 200 && response.data.code === '200') {
          dialog.close();
          await fetchData();
        }
      } catch (error) {
        console.error('保存失败:', error);
      }
    };

    onMounted(() => {
      fetchNodeList();
    });

    return {
      mockList,
      nodeOptions,
      filterNodeId,
      loading,
      pagination,
      dialog,
      jsonViewer,
      form,
      formRef,
      rules,
      getNodeName,
      handleFilterChange,
      resetFilters,
      handleAdd,
      handleEdit,
      handleDelete,
      submitForm
    };
  }
};
</script>

<style scoped>
.mock-config {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

h2 {
  margin-bottom: 20px;
}
</style>
