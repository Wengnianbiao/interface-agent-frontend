<template>
  <div class="workflow-node-list">
    <!-- 筛选区域 -->
    <div style="margin-bottom: 10px; background-color: #f5f7fa; padding: 20px; border-radius: 4px;">
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
        <!-- 归属工作流选择框 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px; color: #666;">归属工作流</span>
          <el-select 
            v-model="filterFlowId" 
            placeholder="全部" 
            clearable 
            @change="handleFilterChange"
            style="width: 180px;"
          >
            <el-option
              v-for="flow in workflowOptions"
              :key="flow.flowId"
              :label="flow.flowName"
              :value="flow.flowId"
            ></el-option>
          </el-select>
        </div>

        <!-- 操作按钮：新增全局导入按钮在新增左侧 -->
        <div style="display: flex; gap: 10px;">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" @click="nodeImportExport.importGlobalNodeConfig">导入节点</el-button>
          <el-button type="success" @click="handleAdd">新增</el-button>
        </div>
      </div>
    </div>

    <!-- 节点表格 -->
    <el-table :data="nodes" style="width: 100%" v-loading="loading">
      <el-table-column prop="nodeName" label="节点名称" width="150"></el-table-column>
      <el-table-column label="所属工作流" width="120">
        <template #default="scope">
          {{ getFlowName(scope.row.flowId) }}
        </template>
      </el-table-column>
      <el-table-column label="节点类型" width="100">
        <template #default="scope">
          <el-tag size="small">{{ scope.row.nodeType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="keywordField" label="关键字字段" width="120"></el-table-column>
      <el-table-column label="节点元数据信息" show-overflow-tooltip header-align="center">
        <template #default="scope">
          <json-preview-cell 
            :content="scope.row.metaInfo" 
            @click="jsonViewer.open($event, '节点元数据信息')"
          />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="500" fixed="right" header-align="center">
        <template #default="scope">
          <!-- 第一行：基础操作按钮 - 全局导出移至编辑左侧 -->
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px;">
            <el-button size="small" @click="nodeImportExport.exportNodeConfig(scope.row)">导出节点</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" @click="handleCopy(scope.row)">复制</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <el-button size="small" type="warning" @click="nodeImportExport.exportNodeParams(scope.row)">导出参数配置</el-button>
            <el-button size="small" type="primary" @click="nodeImportExport.importNodeParams(scope.row)">导入参数配置</el-button>
            <el-button size="small" type="danger" @click="nodeImportExport.deleteAllConfig(scope.row)">全量删除配置</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      @size-change="pagination.handleSizeChange"
      @current-change="pagination.handleCurrentChange"
      :current-page="pagination.pageNum.value"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagination.pageSize.value"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total.value"
      style="margin-top: 20px; text-align: right;"
    >
    </el-pagination>

    <!-- 编辑/新增/复制对话框 -->
    <el-dialog
      :title="dialog.title.value"
      :visible.sync="dialog.visible.value"
      width="600px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item label="节点名称" prop="nodeName">
          <el-input v-model="form.nodeName" placeholder="请输入节点名称"></el-input>
        </el-form-item>

        <el-form-item label="所属工作流" prop="flowId">
          <el-select v-model.number="form.flowId" placeholder="请选择所属工作流" clearable style="width: 100%">
            <el-option
              v-for="flow in workflowOptions"
              :key="flow.flowId"
              :label="flow.flowName"
              :value="flow.flowId"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="节点类型" prop="nodeType">
          <el-select v-model="form.nodeType" placeholder="请选择节点类型">
            <el-option label="HTTP" value="HTTP"></el-option>
            <el-option label="WEBSERVICE" value="WEBSERVICE"></el-option>
            <el-option label="数据库" value="DATABASE"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="关键字字段" prop="keywordField">
          <el-input v-model="form.keywordField" placeholder="请输入关键字字段名"></el-input>
        </el-form-item>

        <el-form-item label="拆分字段" prop="splitField">
          <el-input v-model="form.splitField" placeholder="请输入拆分字段名(必须为数组)"></el-input>
        </el-form-item>

        <el-form-item label="节点元数据信息" prop="metaInfo">
          <el-input
            v-model="form.metaInfo"
            type="textarea"
            :rows="4"
            placeholder='请输入JSON格式的元数据，例如：{"url":"http://xxx","method":"POST","headers":{"Content-Type":"application/json"}}'
          ></el-input>
        </el-form-item>

        <el-form-item label="参数过滤表达式" prop="paramFilterExpr">
          <el-input v-model="form.paramFilterExpr" placeholder="请输入参数过滤表达式"></el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialog.visible.value = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
    </el-dialog>

    <!-- JSON查看器对话框 -->
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
import { getNodeList, createNode, updateNode, deleteNode } from '@/api/workflownode';
import { getAllWorkflowsUnpaged } from '@/api/workflow';
import { usePagination } from '@/composables/usePagination';
import { useTableLoading } from '@/composables/useTableLoading';
import { useDialog } from '@/composables/useDialog';
import { useJsonViewer } from '@/composables/useJsonViewer';
import { useNodeImportExport } from '@/composables/useNodeImportExport';
import JsonViewerDialog from '@/components/common/JsonViewerDialog.vue';
import JsonPreviewCell from '@/components/common/JsonPreviewCell.vue';

export default {
  name: 'WorkflowNode',
  components: {
    JsonViewerDialog,
    JsonPreviewCell
  },
  setup() {
    const nodes = ref([]);
    const workflowOptions = ref([]);
    const flowIdToNameMap = ref(new Map());
    const filterFlowId = ref(null);
    const formRef = ref(null);

    const { loading, withLoading } = useTableLoading();
    const dialog = useDialog();
    const jsonViewer = useJsonViewer();

    const form = reactive({
      nodeId: '',
      nodeName: '',
      flowId: null,
      nodeType: 'HTTP',
      metaInfo: '{}',
      scheduleParamSourceType: '',
      scheduleExpr: '',
      paramFilterExpr: '',
      keywordField: '',
      splitField: '',
      remoteExtension: ''
    });

    const validateJson = (rule, value, callback) => {
      try {
        JSON.parse(value);
        callback();
      } catch (error) {
        callback(new Error('请输入有效的JSON格式'));
      }
    };

    const rules = {
      nodeName: [
        { required: true, message: '请输入节点名称', trigger: 'blur' }
      ],
      nodeType: [
        { required: true, message: '请选择节点类型', trigger: 'change' }
      ],
      scheduleExpr: [
        { validator: (rule, value, callback) => callback(), trigger: 'blur' }
      ],
      metaInfo: [
        { required: true, message: '请输入节点元数据信息', trigger: 'blur' },
        { validator: validateJson, trigger: 'blur' }
      ]
    };

    const fetchData = async () => {
      await withLoading(async () => {
        const params = {
          pageNum: pagination.pageNum.value,
          pageSize: pagination.pageSize.value
        };
        if (filterFlowId.value) {
          params.flowId = filterFlowId.value;
        }

        const response = await getNodeList(params);
        if (response.status === 200 && response.data.code === '200') {
          const pageList = response.data.rsp;
          nodes.value = pageList.rows || [];
          pagination.total.value = pageList.total || 0;
        }
      });
    };

    const pagination = usePagination({ fetchData });
    const nodeImportExport = useNodeImportExport(fetchData);

    const fetchWorkflows = async () => {
      try {
        const response = await getAllWorkflowsUnpaged();
        if (response.status === 200 && response.data.code === '200') {
          const workflows = Array.isArray(response.data.rsp) ? response.data.rsp : [];
          workflowOptions.value = workflows;
          
          const map = new Map();
          workflows.forEach(flow => {
            map.set(flow.flowId, flow.flowName);
          });
          flowIdToNameMap.value = map;
        }
      } catch (error) {
        console.error('获取工作流列表失败:', error);
      }
    };

    const getFlowName = (flowId) => {
      return flowIdToNameMap.value.get(flowId) || '未分配';
    };

    const handleFilterChange = () => {
      pagination.pageNum.value = 1;
      fetchData();
    };

    const resetFilters = () => {
      filterFlowId.value = null;
      pagination.pageNum.value = 1;
      fetchData();
    };

    const handleAdd = () => {
      resetForm();
      dialog.open('新增节点');
    };

    const handleEdit = (row) => {
      Object.assign(form, JSON.parse(JSON.stringify(row)));
      dialog.open('编辑节点');
    };

    const handleCopy = (row) => {
      const copied = JSON.parse(JSON.stringify(row));
      copied.nodeId = '';
      copied.nodeName = `${copied.nodeName}（副本）`;
      copied.flowId = null;
      copied.scheduleExpr = '';
      copied.paramFilterExpr = '';
      copied.keywordField = '';
      copied.splitField = '';
      copied.remoteExtension = '';
      
      Object.assign(form, copied);
      dialog.open('复制节点');
    };

    const handleDelete = async (row) => {
      try {
        await MessageBox.confirm(`确定要删除节点 "${row.nodeName}" 吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        await deleteNode(row.nodeId);
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
        nodeId: '',
        nodeName: '',
        flowId: null,
        nodeType: 'HTTP',
        metaInfo: '{}',
        scheduleParamSourceType: '',
        scheduleExpr: '',
        paramFilterExpr: '',
        keywordField: '',
        splitField: '',
        remoteExtension: ''
      });
    };

    const submitForm = async () => {
      const valid = await formRef.value.validate().catch(() => false);
      if (!valid) return;

      const submitData = { ...form };
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      try {
        let response;
        if (form.nodeId) {
          response = await updateNode(submitData);
        } else {
          response = await createNode(submitData);
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
      fetchData();
      fetchWorkflows();
    });

    return {
      nodes,
      loading,
      pagination,
      dialog,
      jsonViewer,
      nodeImportExport,
      filterFlowId,
      workflowOptions,
      form,
      rules,
      formRef,
      getFlowName,
      handleFilterChange,
      resetFilters,
      handleAdd,
      handleEdit,
      handleCopy,
      handleDelete,
      resetForm,
      submitForm
    };
  }
};
</script>

<style scoped>
.workflow-node-list {
  padding: 20px;
}

.workflow-node-list h2 {
  margin-bottom: 20px;
  color: #333;
}

.el-table {
  margin-top: 10px;
}

.el-table .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

::v-deep .el-tag--info {
  background-color: #e8f4fd;
  color: #1890ff;
}
</style>