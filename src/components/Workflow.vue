<template>
  <div class="workflow-list">
    <h2>工作流管理</h2>

    <!-- 操作按钮区 -->
    <div style="margin-bottom: 10px; text-align: right;">
      <el-button type="success" @click="handleAdd">新增</el-button>
    </div>

    <!-- 工作流表格 -->
    <el-table 
      :data="workflows" 
      style="width: 100%" 
      v-loading="loading" 
      fit="true"
    >
      <el-table-column prop="flowName" label="工作流名称" min-width="200"></el-table-column>
      <el-table-column prop="interfaceUri" label="接口URI" min-width="250"></el-table-column>
      <el-table-column prop="contentType" label="入参类型" min-width="150"></el-table-column>
      <el-table-column label="首节点" min-width="200">
        <template #default="scope">
          <el-tag 
            v-for="nodeName in scope.row.firstFlowNodeNames" 
            :key="nodeName" 
            size="small" 
            style="margin-right: 5px;"
          >
            {{ nodeName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="300">
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

    <!-- 编辑/新增/复制对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="form"
        label-width="120px"
      >
        <el-form-item label="工作流名称" prop="flowName">
          <el-input v-model="form.flowName" placeholder="请输入工作流名称"></el-input>
        </el-form-item>

        <el-form-item label="接口URI" prop="interfaceUri">
          <el-input v-model="form.interfaceUri" placeholder="请输入接口URI"></el-input>
        </el-form-item>

        <el-form-item label="入参类型" prop="contentType">
          <el-select v-model="form.contentType" placeholder="请选择入参类型">
            <el-option label="JSON" value="JSON"></el-option>
            <el-option label="XML" value="XML"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="入参元信息" prop="contentMateInfo">
          <el-input 
            v-model="form.contentMateInfo" 
            type="textarea"
            :rows="3"
            placeholder="请输入入参元信息">
          </el-input>
        </el-form-item>

        <el-form-item label="首节点" prop="firstFlowNodes">
          <el-select
            v-model="form.firstFlowNodes"
            multiple
            placeholder="请选择首节点"
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

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getWorkflows, getAllNodes, createWorkflow, updateWorkflow, deleteWorkflow } from '@/api/workflow';

export default {
  name: 'WorkFlowList',
  data() {
    return {
      workflows: [],
      loading: false,
      pagination: {
        total: 0,
        pageNum: 1,
        pageSize: 10
      },
      dialogVisible: false,
      dialogTitle: '编辑工作流',
      form: {
        flowName: '',
        interfaceUri: '',
        contentType: 'JSON', // 默认值设为JSON
        contentMateInfo: '',
        firstFlowNodes: [],
        status: 1
      },
      rules: {
        flowName: [
          { required: true, message: '请输入工作流名称', trigger: 'blur' }
        ],
        interfaceUri: [
          { required: true, message: '请输入接口URI', trigger: 'blur' }
        ],
        contentType: [
          { required: true, message: '请选择入参类型', trigger: 'change' },
          { 
            type: 'enum', 
            enum: ['JSON', 'XML'], 
            message: '入参类型只能是 JSON 或 XML', 
            trigger: 'change' 
          }
        ],
        firstFlowNodes: [
          { required: true, message: '请选择首节点', trigger: 'change' }
        ]
      },
      nodeOptions: [], // 节点列表，用于下拉选择
      nodeMap: new Map(), // 节点ID到名称的映射
      currentEditingFlowId: null
    };
  },
  mounted() {
    this.fetchNodeList(); 
  },
  methods: {
    async fetchWorkflows() {
      this.loading = true;
      try {
        const params = {
          pageNum: this.pagination.pageNum,
          pageSize: this.pagination.pageSize
        };
        const response = await getWorkflows(params);        
        
        if (response.status === 200 && response.data.code === '200') {
          const pageList = response.data.rsp;
          // 处理工作流数据，添加首节点名称数组
          this.workflows = (pageList.rows || []).map(workflow => ({
            ...workflow,
            firstFlowNodeNames: workflow.firstFlowNodes.map(id => 
              this.nodeMap.get(id)
            )
          }));
          this.pagination.total = pageList.total || 0;
        } else {
          this.$message.error('获取工作流列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取工作流列表失败: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.pageNum = 1;
      this.fetchWorkflows();
    },

    handleCurrentChange(val) {
      this.pagination.pageNum = val;
      this.fetchWorkflows();
    },

    async fetchNodeList() {
      try {
        const response = await getAllNodes();
        if (response.status === 200 && response.data.code === '200') {
          this.nodeOptions = response.data.rsp || [];
          // 构建节点ID到名称的映射
          this.nodeMap = new Map();
          this.nodeOptions.forEach(node => {
            this.nodeMap.set(node.nodeId, node.nodeName);
          });
          // 重新获取工作流以更新首节点名称
          this.fetchWorkflows();
        } else {
          this.$message.error('获取节点列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取节点列表失败: ' + error.message);
      }
    },

    handleAdd() {
      this.resetForm();
      this.dialogTitle = '新增工作流';
      this.dialogVisible = true;
    },

    handleEdit(row) {
      this.form = {
        flowName: row.flowName,
        interfaceUri: row.interfaceUri,
        contentType: row.contentType,
        contentMateInfo: row.contentMateInfo,
        firstFlowNodes: row.firstFlowNodes,
        status: row.status
      };
      // 保存当前编辑的工作流ID
      this.currentEditingFlowId = row.flowId;
      this.dialogTitle = '编辑工作流';
      this.dialogVisible = true;
    },

    handleCopy(row) {
      this.form = {
        flowName: row.flowName + '（副本）',
        interfaceUri: row.interfaceUri,
        contentType: row.contentType,
        contentMateInfo: row.contentMateInfo,
        firstFlowNodes: row.firstFlowNodes,
        status: row.status
      };
      // 复制时清空ID，表示创建新工作流
      this.currentEditingFlowId = null;
      this.dialogTitle = '复制工作流';
      this.dialogVisible = true;
    },

    handleDelete(row) {
      this.$confirm(`确定要删除工作流 "${row.flowName}" 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteWorkflow(row.flowId);
          this.$message.success('删除成功');
          this.fetchWorkflows();
        } catch (error) {
          this.$message.error('删除失败: ' + error.message);
        }
      }).catch(() => {});
    },

    resetForm() {
      this.$refs.form?.resetFields();
      this.form = {
        flowName: '',
        interfaceUri: '',
        contentType: 'JSON', // 重置时默认JSON
        contentMateInfo: '',
        firstFlowNodes: [],
        status: 1
      };
      // 重置时清空当前编辑的ID
      this.currentEditingFlowId = null;
    },

    submitForm() {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          try {
            let response;
            // 根据是否有currentEditingFlowId判断是新增还是编辑
            if (this.currentEditingFlowId) {
              // 编辑：使用PUT更新
              const formData = {
                ...this.form,
                flowId: this.currentEditingFlowId
              };
              response = await updateWorkflow(formData);
            } else {
              // 新增或复制：使用POST创建
              const formData = {
                ...this.form
              };
              response = await createWorkflow(formData);
            }

            if (response.status === 200 && response.data.code === '200') {
              this.$message.success('保存成功');
              this.dialogVisible = false;
              this.fetchWorkflows();
            } else {
              this.$message.error('保存失败: ' + response.data.message);
            }
          } catch (error) {
            this.$message.error('保存失败: ' + error.message);
          }
        }
      });
    },
    
    // 移除ID字段的辅助函数
    removeIdFields(obj) {
      const result = { ...obj };
      // delete result.flowId;
      // delete result.nodeId;
      // delete result.configId;
      return result;
    }
  }
};
</script>

<style scoped>
.workflow-list {
  padding: 20px;
  width: 100%;
}

.workflow-list h2 {
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
</style>