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
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.pageNum"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagination.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      style="margin-top: 20px; text-align: right;"
    >
    </el-pagination>

    <!-- 编辑/新增对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="editDialogVisible"
      width="600px"
      @close="resetEditForm"
    >
      <el-form
        :model="editForm"
        :rules="editRules"
        ref="editForm"
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
            <el-option label="直接映射" value="DIRECT"></el-option>
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
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitEditForm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request';

export default {
  name: 'NodeParamConfig',
  data() {
    return {
      searchForm: {
        nodeId: '',
        processType: '',
        targetParam: ''  // 新增的搜索字段
      },
      configList: [],
      loading: false,
      pagination: {
        total: 0,
        pageNum: 1,
        pageSize: 10
      },
      dialogTitle: '编辑参数配置',
      editDialogVisible: false,
      editForm: {
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
        paramDesc: ''
      },
      editRules: {
        nodeId: [
          { required: true, message: '请选择节点', trigger: 'change' }
        ],
        parentId: [
          { required: false, message: '请选择父参数', trigger: 'change' }
        ],
        sourceParamKey: [
          { required: false, message: '请输入源参数名', trigger: 'blur' }
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
        ],
        mappingRule: [
          { required: false, message: '请输入映射规则', trigger: 'blur' }
        ],
        paramDesc: [
          { required: false, message: '请输入参数描述', trigger: 'blur' }
        ]
      },
      nodeOptions: [],
      nodeMap: new Map(),
      configParentOptions: [],
      configParentMap: new Map(),
      allParentConfigs: []
    };
  },
  mounted() {
    this.fetchNodeList();
  },
  watch: {
    'editForm.sourceParamType'(newVal) {
      const sourceParamKeyRule = this.editRules.sourceParamKey[0];
      if (newVal === 'NONE') {
        sourceParamKeyRule.required = false;
        this.editForm.sourceParamKey = '';
      }
    },
    'editForm.nodeId': function(newVal) {
      if (newVal) {
        this.fetchConfigParentList();
      }
    },
    'editForm.processType': function(newVal) {
      if (newVal) {
        this.fetchConfigParentList();
      }
    },
    'editForm.targetParamType': function(newVal) {
      // 当目标参数类型不是OBJECT时，重置keepSingleElementKey为false
      if (newVal !== 'OBJECT') {
        this.editForm.keepSingleElementKey = false;
      }
    }
  },
  methods: {
    getParentParamName(parentId) {
      if (!parentId) return '';
      
      const parentConfig = this.allParentConfigs.find(item => item.configId === parentId);
      if (parentConfig) {
        return `${parentConfig.targetParamKey} (${parentConfig.paramDesc || '无描述'})`;
      }
      
      this.fetchParentParamDetails(parentId);
      
      return parentId;
    },

    async fetchParentParamDetails(parentId) {
      if (this.loadingParentIds && this.loadingParentIds.includes(parentId)) {
        return;
      }
      
      this.loadingParentIds = this.loadingParentIds || [];
      this.loadingParentIds.push(parentId);
      
      try {
        const response = await request.get(`/v1/console/node-param/${parentId}`);
        if (response.status === 200 && response.data.code === '200') {
          const parentConfig = response.data.rsp;
          if (!this.allParentConfigs.some(item => item.configId === parentId)) {
            this.allParentConfigs.push(parentConfig);
          }
          this.configParentMap.set(parentId, parentConfig);
          if (!this.configParentOptions.some(item => item.configId === parentId)) {
            this.configParentOptions.push(parentConfig);
          }
          this.$forceUpdate();
        }
      } catch (error) {
        console.log('获取父参数详情失败: ' + error.message);
      } finally {
        this.loadingParentIds = this.loadingParentIds.filter(id => id !== parentId);
      }
    },

    async fetchNodeList() {
      try {
        const response = await request.get('/v1/console/node/all-unpaged');
        if (response.status === 200 && response.data.code === '200') {
          this.nodeOptions = response.data.rsp || [];
          this.nodeMap = new Map();
          this.nodeOptions.forEach(node => {
            this.nodeMap.set(node.nodeId, node.nodeName);
          });
          this.fetchAllParentConfigs();
          this.fetchConfigList();
        } else {
          this.$message.error('获取节点列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取节点列表失败: ' + error.message);
      }
    },

    async fetchAllParentConfigs() {
      try {
        const response = await request.get('/v1/console/node-param/all-unpaged');
        if (response.status === 200 && response.data.code === '200') {
          this.allParentConfigs = response.data.rsp || [];
          this.configParentMap = new Map();
          this.allParentConfigs.forEach(config => {
            this.configParentMap.set(config.configId, config);
          });
        } else {
          this.$message.error('获取所有父参数配置失败: ' + response.data.message);
        }
      } catch (error) {
        console.log('获取所有父参数配置失败: ' + error.message);
      }
    },

    async fetchConfigList() {
      this.loading = true;
      try {
        const params = {
          nodeId: this.searchForm.nodeId || undefined,
          processType: this.searchForm.processType || undefined,
          targetParam: this.searchForm.targetParam || undefined,  // 添加新参数
          pageNum: this.pagination.pageNum,
          pageSize: this.pagination.pageSize
        };
        const response = await request.get('/v1/console/node-param/all', { params });
        if (response.status === 200 && response.data.code === '200') {
          const pageList = response.data.rsp;
          this.configList = pageList.rows || [];
          this.pagination.total = pageList.total || 0;
          
          this.loadMissingParentConfigs();
        } else {
          this.$message.error('获取参数配置列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取参数配置列表失败: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    loadMissingParentConfigs() {
      const parentIds = new Set();
      this.configList.forEach(item => {
        if (item.parentId) {
          parentIds.add(item.parentId);
        }
      });
      
      const missingParentIds = [];
      parentIds.forEach(id => {
        if (!this.allParentConfigs.some(config => config.configId === id)) {
          missingParentIds.push(id);
        }
      });
      
      missingParentIds.forEach(id => {
        this.fetchParentParamDetails(id);
      });
    },

    async fetchConfigParentList() {
      try {
        const params = {
          nodeId: this.editForm.nodeId,
          processType: this.editForm.processType
        };

        const response = await request.get('/v1/console/node-param/all-unpaged', { params });
        if (response.status === 200 && response.data.code === '200') {
          this.configParentOptions = (response.data.rsp || []).filter(
            config => !this.editForm.configId || config.configId !== this.editForm.configId
          );
        } else {
          this.$message.error('获取父参数列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取父参数列表失败: ' + error.message);
      }
    },

    handleSearch() {
      this.pagination.pageNum = 1;
      this.fetchConfigList();
    },

    handleReset() {
      this.searchForm.nodeId = '';
      this.searchForm.processType = '';
      this.searchForm.targetParam = '';  // 重置新字段
      this.pagination.pageNum = 1;
      this.fetchConfigList();
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.pageNum = 1;
      this.fetchConfigList();
    },

    handleCurrentChange(val) {
      this.pagination.pageNum = val;
      this.fetchConfigList();
    },

    handleEdit(row) {
      this.editForm = { ...row };
      this.editDialogVisible = true;
      this.dialogTitle = '编辑参数配置';
      this.fetchConfigParentList();
    },

    handleCopy(row) {
      this.editForm = { ...row, configId: '', paramDesc: row.paramDesc || '' };
      this.editDialogVisible = true;
      this.dialogTitle = '复制参数配置';
      this.fetchConfigParentList();
    },

    handleDelete(row) {
      this.$confirm(`确定要删除参数配置吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await request.delete(`/v1/console/node-param/${row.configId}`);
          this.$message.success('删除成功');
          this.fetchConfigList();
          this.fetchAllParentConfigs();
        } catch (error) {
          this.$message.error('删除失败: ' + error.message);
        }
      }).catch(() => {
        // 取消删除
      });
    },

    handleAdd() {
      this.resetEditForm();
      this.editDialogVisible = true;
      this.dialogTitle = '新增参数配置';
    },

    resetEditForm() {
      this.$refs.editForm?.resetFields();
      this.editForm = {
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
        paramDesc: ''
      };
      this.configParentOptions = [];
    },

    submitEditForm() {
      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          try {
            const submitData = { ...this.editForm };
            
            if (submitData.sourceParamType === 'NONE') {
              submitData.sourceParamKey = null;
            }
            
            if (submitData.parentId === '') {
              submitData.parentId = null;
            }
            
            // 当目标参数类型不是OBJECT时，不传递keepSingleElementKey字段
            if (submitData.targetParamType !== 'OBJECT') {
              delete submitData.keepSingleElementKey;
            }
            
            let response;
            if (submitData.configId) {
              response = await request.post('/v1/console/node-param/update', submitData);
            } else {
              response = await request.post('/v1/console/node-param/create', submitData);
            }

            if (response.status === 200 && response.data.code === '200') {
              this.$message.success('保存成功');
              this.editDialogVisible = false;
              this.fetchConfigList();
              this.fetchAllParentConfigs();
            } else {
              this.$message.error('保存失败: ' + response.data.message);
            }
          } catch (error) {
            this.$message.error('保存失败: ' + error.message);
          }
        }
      });
    }
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