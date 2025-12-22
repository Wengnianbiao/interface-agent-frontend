<template>
  <div class="node-param-config">
    <h2>节点参数配置</h2>

    <!-- 搜索条件 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="节点">
        <el-select v-model="searchForm.nodeId" placeholder="请选择节点" clearable>
          <el-option label="全部" value=""></el-option>
          <el-option v-for="node in nodeOptions" :key="node.nodeId" :label="node.nodeName" :value="node.nodeId"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="处理类型">
        <el-select v-model="searchForm.processType" placeholder="请选择处理类型" clearable>
          <el-option label="前置处理" value="PRE_PROCESS"></el-option>
          <el-option label="后置处理" value="POST_PROCESS"></el-option>
        </el-select>
      </el-form-item>

      <!-- 新增的targetParam搜索框 -->
      <el-form-item label="目标参数名">
        <el-input v-model="searchForm.targetParam" placeholder="请输入目标参数名" clearable></el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="handleAdd">新增</el-button>
      </el-form-item>
    </el-form>

    <!-- 参数配置表格 -->
    <el-table :data="configList" style="width: 100%" v-loading="loading">
      <el-table-column label="节点名称" width="150">
        <template #default="scope">
          {{ nodeMap.get(scope.row.nodeId) || scope.row.nodeId }}
        </template>
      </el-table-column>
      <el-table-column prop="processType" label="处理类型" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.processType === 'PRE_PROCESS' ? 'primary' : 'success'">
            {{ scope.row.processType === 'PRE_PROCESS' ? '前置处理' : '后置处理' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="mappingSource" label="映射来源" width="120" v-if="showMappingSourceColumn">
        <template #default="scope">
          <el-tag size="small">{{ scope.row.mappingSource}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="paramDesc" label="参数描述" show-overflow-tooltip width="200"></el-table-column>
      <el-table-column prop="sourceParamKey" label="源参数名" width="150"></el-table-column>
      <el-table-column prop="sourceParamType" label="源参数类型" width="120">
        <template #default="scope">
          <el-tag size="small">{{ scope.row.sourceParamType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="targetParamKey" label="目标参数名" width="150"></el-table-column>
      <el-table-column prop="targetParamType" label="目标参数类型" width="120">
        <template #default="scope">
          <el-tag size="small">{{ scope.row.targetParamType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="mappingType" label="映射类型" width="120"></el-table-column>
      <el-table-column prop="mappingRule" label="映射规则" show-overflow-tooltip></el-table-column>
      <el-table-column label="父参数" width="200">
        <template #default="scope">
          {{ getParentParamName(scope.row.parentId) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" @click="handleCopy(scope.row)">复制</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 编辑/新增对话框 -->
    <el-dialog
        :title="dialog.title.value"
        :visible.sync="dialog.visible.value"
        width="600px"
        @close="resetEditForm"
    >
      <el-form
          :model="editForm"
          :rules="editRules"
          ref="editFormRef"
          label-width="120px"
      >
        <el-form-item label="节点" prop="nodeId">
          <el-select v-model="editForm.nodeId" placeholder="请选择节点">
            <el-option v-for="node in nodeOptions" :key="node.nodeId" :label="node.nodeName" :value="node.nodeId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="处理类型" prop="processType">
          <el-select v-model="editForm.processType" placeholder="请选择处理类型">
            <el-option label="前置处理" value="PRE_PROCESS"></el-option>
            <el-option label="后置处理" value="POST_PROCESS"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="映射来源" prop="mappingSource" v-if="editForm.processType === 'POST_PROCESS'">
          <el-select v-model="editForm.mappingSource" placeholder="请选择映射来源" clearable>
            <el-option label="上游响应" value="RESPONSE"></el-option>
            <el-option label="原始入参" value="INPUT"></el-option>
          </el-select>
          <el-tooltip
              content="映射来源用于指定目标参数从哪里获取：上游响应表示来自接口响应结果；原始入参表示来自原始请求参数；空值表示不区分。"
              placement="top"
              effect="light"
          >
            <i class="el-icon-question" style="color: orange; margin-left: 10px; cursor: pointer;"></i>
          </el-tooltip>
        </el-form-item>

        <!-- 源参数名：当源参数类型为NONE时隐藏 -->
        <el-form-item
            label="源参数名"
            prop="sourceParamKey"
            v-if="editForm.sourceParamType !== 'NONE'"

        >
          <el-input v-model="editForm.sourceParamKey" placeholder="请输入源参数名"></el-input>
        </el-form-item>
        <el-form-item label="源参数类型" prop="sourceParamType">
          <el-select v-model="editForm.sourceParamType" placeholder="请选择源参数类型">
            <el-option label="字符串" value="STRING"></el-option>
            <el-option label="数字INT" value="INTEGER"></el-option>
            <el-option label="数字LONG" value="LONG"></el-option>
            <el-option label="布尔" value="BOOLEAN"></el-option>
            <el-option label="对象" value="OBJECT"></el-option>
            <el-option label="数组" value="ARRAY"></el-option>
            <el-option label="纯数组" value="PURE_ARRAY"></el-option>
            <el-option label="无" value="NONE"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="目标参数名" prop="targetParamKey">
          <el-input v-model="editForm.targetParamKey" placeholder="请输入目标参数名"></el-input>
        </el-form-item>

        <el-form-item label="目标参数类型" prop="targetParamType">
          <el-select v-model="editForm.targetParamType" placeholder="请选择目标参数类型">
            <el-option label="字符串" value="STRING"></el-option>
            <el-option label="数字INT" value="INTEGER"></el-option>
            <el-option label="数字LONG" value="LONG"></el-option>
            <el-option label="布尔" value="BOOLEAN"></el-option>
            <el-option label="对象" value="OBJECT"></el-option>
            <el-option label="数组" value="ARRAY"></el-option>
            <el-option label="纯数组" value="PURE_ARRAY"></el-option>
            <el-option label="无" value="NONE"></el-option>
          </el-select>
        </el-form-item>

        <!-- 仅当目标参数类型为对象时显示 -->
        <el-form-item
            label="保留单元素Key"
            prop="keepSingleElementKey"
            v-if="editForm.targetParamType === 'OBJECT'"
        >
          <el-switch
              v-model="editForm.keepSingleElementKey"
              active-text=""
              inactive-text="">
          </el-switch>
          <el-tooltip
              content="当对象中只有一个元素时是否保留key"
              placement="top"
              effect="light"
          >
            <i class="el-icon-question" style="color: orange; margin-left: 14px; cursor: pointer;"></i>
          </el-tooltip>
        </el-form-item>

        <el-form-item label="父参数" prop="parentId">
          <el-select v-model="editForm.parentId" placeholder="请选择父参数" clearable>
            <el-option
                v-for="config in configParentOptions"
                :key="config.configId"
                :label="`${config.targetParamKey} (${config.paramDesc || '无描述'})`"
                :value="config.configId"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="映射类型" prop="mappingType">
          <el-select v-model="editForm.mappingType" placeholder="请选择映射类型">
            <el-option label="固定值" value="CONSTANT"></el-option>
            <el-option label="值映射" value="NAME"></el-option>
            <el-option label="表达式" value="EXPRESSION"></el-option>
            <el-option label="函数表达式" value="BEAN_EXPRESSION"></el-option>
            <el-option label="单值映射" value="SINGLE_MAP"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="映射规则" prop="mappingRule">
          <el-input
              v-model="editForm.mappingRule"
              type="textarea"
              :rows="4"
              placeholder="请输入映射规则"
          ></el-input>
        </el-form-item>

        <el-form-item label="参数描述" prop="paramDesc">
          <el-input
              v-model="editForm.paramDesc"
              type="textarea"
              :rows="2"
              placeholder="请输入参数描述，用于说明目标参数的业务用途"
          ></el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialog.visible.value = false">取 消</el-button>
        <el-button type="primary" @click="submitEditForm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue';
import { MessageBox } from 'element-ui';
import { getNodeParams, getNodeParamsUnpaged, getNodeParamDetail, createNodeParam, updateNodeParam, deleteNodeParam } from '@/api/nodeParam';
import { getNodeListUnpaged } from '@/api/workflownode';
import { usePagination } from '@/composables/usePagination';
import { useTableLoading } from '@/composables/useTableLoading';
import { useDialog } from '@/composables/useDialog';

export const MappingSource = {
  RESPONSE: 'RESPONSE',
  INPUT: 'INPUT'
};

export default {
  name: 'NodeParamConfig',
  setup() {
    const searchForm = reactive({
      nodeId: '',
      processType: '',
      targetParam: ''
    });

    const configList = ref([]);
    const nodeOptions = ref([]);
    const nodeMap = ref(new Map());
    const configParentOptions = ref([]);
    const configParentMap = ref(new Map());
    const allParentConfigs = ref([]);
    const showMappingSourceColumn = ref(false);
    const editFormRef = ref(null);

    const { loading, withLoading } = useTableLoading();
    const dialog = useDialog();

    const editForm = reactive({
      configId: '',
      nodeId: '',
      parentId: '',
      sourceParamKey: '',
      sourceParamType: '',
      targetParamKey: '',
      targetParamType: '',
      keepSingleElementKey: false,
      processType: '',
      mappingType: '',
      mappingRule: '',
      paramDesc: '',
      mappingSource: ''
    });

    const editRules = {
      nodeId: [
        { required: true, message: '请选择节点', trigger: 'change' }
      ],
      sourceParamType: [
        { required: true, message: '请选择源参数类型', trigger: 'change' }
      ],
      targetParamKey: [
        { required: true, message: '请输入目标参数名', trigger: 'blur' }
      ],
      targetParamType: [
        { required: true, message: '请选择目标参数类型', trigger: 'change' }
      ],
      processType: [
        { required: true, message: '请选择处理类型', trigger: 'change' }
      ],
      mappingType: [
        { required: true, message: '请选择映射类型', trigger: 'change' }
      ]
    };

    const fetchData = async () => {
      await withLoading(async () => {
        const params = {
          nodeId: searchForm.nodeId || undefined,
          processType: searchForm.processType || undefined,
          targetParam: searchForm.targetParam || undefined,
          pageNum: pagination.pageNum.value,
          pageSize: pagination.pageSize.value
        };
        const response = await getNodeParams(params);
        if (response.status === 200 && response.data.code === '200') {
          const pageList = response.data.rsp;
          configList.value = pageList.rows || [];
          pagination.total.value = pageList.total || 0;
          
          showMappingSourceColumn.value = configList.value.some(item => item.processType === 'POST_PROCESS');
          loadMissingParentConfigs();
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
          
          await fetchAllParentConfigs();
          await fetchData();
        }
      } catch (error) {
        console.error('获取节点列表失败:', error);
      }
    };

    const fetchAllParentConfigs = async () => {
      try {
        const response = await getNodeParamsUnpaged();
        if (response.status === 200 && response.data.code === '200') {
          allParentConfigs.value = response.data.rsp || [];
          const map = new Map();
          allParentConfigs.value.forEach(config => {
            map.set(config.configId, config);
          });
          configParentMap.value = map;
        }
      } catch (error) {
        console.error('获取所有父参数配置失败:', error);
      }
    };

    const fetchConfigParentList = async () => {
      try {
        const params = {
          nodeId: editForm.nodeId,
          processType: editForm.processType
        };

        const response = await getNodeParamsUnpaged(params);
        if (response.status === 200 && response.data.code === '200') {
          configParentOptions.value = (response.data.rsp || []).filter(
            config => !editForm.configId || config.configId !== editForm.configId
          );
        }
      } catch (error) {
        console.error('获取父参数列表失败:', error);
      }
    };

    const loadMissingParentConfigs = () => {
      const parentIds = new Set();
      configList.value.forEach(item => {
        if (item.parentId) {
          parentIds.add(item.parentId);
        }
      });

      const missingParentIds = [];
      parentIds.forEach(id => {
        if (!allParentConfigs.value.some(config => config.configId === id)) {
          missingParentIds.push(id);
        }
      });

      missingParentIds.forEach(id => {
        fetchParentParamDetails(id);
      });
    };

    const fetchParentParamDetails = async (parentId) => {
      try {
        const response = await getNodeParamDetail(parentId);
        if (response.status === 200 && response.data.code === '200') {
          const parentConfig = response.data.rsp;
          if (!allParentConfigs.value.some(item => item.configId === parentId)) {
            allParentConfigs.value.push(parentConfig);
          }
          configParentMap.value.set(parentId, parentConfig);
          if (!configParentOptions.value.some(item => item.configId === parentId)) {
            configParentOptions.value.push(parentConfig);
          }
        }
      } catch (error) {
        console.error('获取父参数详情失败:', error);
      }
    };

    const getParentParamName = (parentId) => {
      if (!parentId) return '';

      const parentConfig = allParentConfigs.value.find(item => item.configId === parentId);
      if (parentConfig) {
        return `${parentConfig.targetParamKey} (${parentConfig.paramDesc || '无描述'})`;
      }

      fetchParentParamDetails(parentId);
      return parentId;
    };

    const handleSearch = () => {
      pagination.pageNum.value = 1;
      fetchData();
    };

    const handleReset = () => {
      searchForm.nodeId = '';
      searchForm.processType = '';
      searchForm.targetParam = '';
      pagination.pageNum.value = 1;
      fetchData();
    };

    const handleEdit = (row) => {
      Object.assign(editForm, { ...row, mappingSource: row.mappingSource });
      dialog.open('编辑参数配置');
      fetchConfigParentList();
    };

    const handleCopy = (row) => {
      Object.assign(editForm, {
        ...row,
        configId: '',
        paramDesc: row.paramDesc || '',
        mappingSource: row.mappingSource
      });
      dialog.open('复制参数配置');
      fetchConfigParentList();
    };

    const handleDelete = async (row) => {
      try {
        await MessageBox.confirm(`确定要删除参数配置吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        await deleteNodeParam(row.configId);
        await fetchData();
        await fetchAllParentConfigs();
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error);
        }
      }
    };

    const handleAdd = () => {
      resetEditForm();
      dialog.open('新增参数配置');
    };

    const resetEditForm = () => {
      editFormRef.value?.resetFields();
      Object.assign(editForm, {
        configId: '',
        nodeId: '',
        parentId: '',
        sourceParamKey: '',
        sourceParamType: '',
        targetParamKey: '',
        targetParamType: '',
        keepSingleElementKey: false,
        processType: '',
        mappingType: '',
        mappingRule: '',
        paramDesc: '',
        mappingSource: null
      });
      configParentOptions.value = [];
    };

    const submitEditForm = async () => {
      const valid = await editFormRef.value.validate().catch(() => false);
      if (!valid) return;

      try {
        const submitData = { ...editForm };

        if (submitData.sourceParamType === 'NONE') {
          submitData.sourceParamKey = null;
        }

        if (submitData.parentId === '') {
          submitData.parentId = null;
        }

        if (submitData.targetParamType !== 'OBJECT') {
          delete submitData.keepSingleElementKey;
        }

        if (submitData.processType !== 'POST_PROCESS') {
          delete submitData.mappingSource;
        } else if (submitData.mappingSource === null || submitData.mappingSource === '') {
          submitData.mappingSource = null;
        }

        let response;
        if (submitData.configId) {
          response = await updateNodeParam(submitData);
        } else {
          response = await createNodeParam(submitData);
        }

        if (response.status === 200 && response.data.code === '200') {
          dialog.close();
          await fetchData();
          await fetchAllParentConfigs();
        }
      } catch (error) {
        console.error('保存失败:', error);
      }
    };

    watch(() => editForm.sourceParamType, (newVal) => {
      if (newVal === 'NONE') {
        editForm.sourceParamKey = '';
      }
    });

    watch(() => editForm.nodeId, (newVal) => {
      if (newVal) {
        fetchConfigParentList();
      }
    });

    watch(() => editForm.processType, (newVal) => {
      showMappingSourceColumn.value = configList.value.some(item => item.processType === 'POST_PROCESS');
      if (newVal) {
        fetchConfigParentList();
      }
    });

    watch(() => editForm.targetParamType, (newVal) => {
      if (newVal !== 'OBJECT') {
        editForm.keepSingleElementKey = false;
      }
    });

    onMounted(() => {
      fetchNodeList();
    });

    return {
      searchForm,
      configList,
      loading,
      pagination,
      dialog,
      nodeOptions,
      nodeMap,
      editForm,
      editRules,
      editFormRef,
      configParentOptions,
      showMappingSourceColumn,
      getParentParamName,
      handleSearch,
      handleReset,
      handleEdit,
      handleCopy,
      handleDelete,
      handleAdd,
      resetEditForm,
      submitEditForm
    };
  }
};
</script>

<style scoped>
.node-param-config {
  padding: 20px;
}

.node-param-config h2 {
  margin-bottom: 20px;
  color: #333;
}

.search-form {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.el-table {
  margin-top: 10px;
}

.el-table .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
