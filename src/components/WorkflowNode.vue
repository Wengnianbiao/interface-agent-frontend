<template>
  <div class="workflow-node-list">
    <h2>工作流节点</h2>

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

        <!-- 操作按钮 -->
        <div style="display: flex; gap: 10px;">
          <el-button @click="resetFilters">重置</el-button>
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
          <div class="json-container" @click="openJsonDialog(scope.row.metaInfo, '节点元数据信息')">
            <pre class="json-preview">{{ formatJsonPreview(scope.row.metaInfo) }}</pre>
            <div class="json-overlay">点击查看详情</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="450" fixed="right" header-align="center">
        <template #default="scope">
          <!-- 第一行：基础操作按钮 -->
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px;">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" @click="handleCopy(scope.row)">复制</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </div>

          <!-- 第二行：导出导入 + 全量删除配置按钮 -->
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <el-button size="small" type="warning" @click="exportNodeParams(scope.row)">导出参数配置</el-button>
            <el-button size="small" type="primary" @click="handleImportClick(scope.row)">导入参数配置</el-button>
            <el-button size="small" type="danger" @click="handleDeleteAllConfig(scope.row)">全量删除配置</el-button>
          </div>
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

        <el-form-item label="调度参数类型" prop="scheduleParamSourceType">
          <el-select v-model="form.scheduleParamSourceType" placeholder="请选择调度参数类型" clearable>
            <el-option label="原始入参" value="ORIGINAL"></el-option>
            <el-option label="上个节点响应" value="PRE_RESPONSE"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="调度表达式" prop="scheduleExpr">
          <el-input v-model="form.scheduleExpr" placeholder="请输入调度表达式"></el-input>
        </el-form-item>

        <el-form-item label="参数过滤表达式" prop="paramFilterExpr">
          <el-input v-model="form.paramFilterExpr" placeholder="请输入参数过滤表达式"></el-input>
        </el-form-item>

        <el-form-item label="关键字字段" prop="keywordField">
          <el-input v-model="form.keywordField" placeholder="请输入关键字字段名"></el-input>
        </el-form-item>

        <el-form-item label="节点元数据信息" prop="metaInfo">
          <el-input
            v-model="form.metaInfo"
            type="textarea"
            :rows="4"
            placeholder="请输入JSON格式的元数据，例如：{&quot;url&quot;:&quot;http://xxx&quot;,&quot;method&quot;:&quot;POST&quot;}"
          ></el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
    </el-dialog>

    <!-- JSON详情弹窗 -->
    <el-dialog
      :title="jsonDialogTitle"
      :visible.sync="jsonDialogVisible"
      width="80%"
      top="20px"
      @close="resetJsonDialog"
    >
      <div class="json-detail-container">
        <json-viewer 
          :value="parsedJson" 
          :expand-depth="3" 
          :copyable="false"
          :sort="false"
          class="left-aligned-json"
        >
          <template #copy>
            <el-button size="mini" @click.stop="copyJson">复制内容</el-button>
          </template>
        </json-viewer>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="copyJson">复制内容</el-button>
        <el-button type="primary" @click="jsonDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request';
import JsonViewer from 'vue-json-viewer';

export default {
  name: 'WorkflowNode',
  components: {
    JsonViewer
  },
  data() {
    return {
      nodes: [],
      loading: false,
      dialogVisible: false,
      dialogTitle: '编辑节点',
      filterFlowId: null,
      form: {
        nodeId: '',
        nodeName: '',
        flowId: null,
        nodeType: 'HTTP',
        metaInfo: '{}',
        scheduleParamSourceType: '',
        scheduleExpr: '',
        paramFilterExpr: '',
        keywordField: ''
      },
      rules: {
        nodeName: [
          { required: true, message: '请输入节点名称', trigger: 'blur' }
        ],
        nodeType: [
          { required: true, message: '请选择节点类型', trigger: 'change' }
        ],
        scheduleExpr: [
          { validator: this.validateScheduleExpr, trigger: 'blur' }
        ],
        metaInfo: [
          { required: true, message: '请输入节点元数据信息', trigger: 'blur' },
          { validator: this.validateJson, trigger: 'blur' }
        ]
      },
      workflowOptions: [],
      flowIdToNameMap: new Map(),
      pagination: {
        total: 0,
        pageNum: 1,
        pageSize: 10
      },
      currentNode: null,

      // JSON弹窗相关
      jsonDialogVisible: false,
      jsonDialogTitle: '',
      currentJson: '',
      parsedJson: null,
    };
  },
  mounted() {
    this.fetchNodes();
    this.fetchWorkflows();
  },
  methods: {
    validateJson(rule, value, callback) {
      try {
        JSON.parse(value);
        callback();
      } catch (error) {
        callback(new Error('请输入有效的JSON格式'));
      }
    },

    validateScheduleExpr(rule, value, callback) {
      callback();
    },

    async fetchNodes() {
      this.loading = true;
      try {
        const params = {
          pageNum: this.pagination.pageNum,
          pageSize: this.pagination.pageSize
        };
        if (this.filterFlowId) {
          params.flowId = this.filterFlowId;
        }

        const response = await request.get('/v1/console/node/all', { params });

        if (response.status === 200 && response.data.code === '200') {
          const pageList = response.data.rsp;
          this.nodes = pageList.rows || [];
          this.pagination.total = pageList.total || 0;
        } else {
          this.$message.error('获取节点列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取节点列表失败: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    async fetchWorkflows() {
      try {
        const response = await request.get('/v1/console/workflow/all-unpaged');
        if (response.status === 200 && response.data.code === '200') {
          const workflows = Array.isArray(response.data.rsp) ? response.data.rsp : [];
          this.workflowOptions = workflows;
          this.flowIdToNameMap.clear();

          workflows.forEach(flow => {
            this.flowIdToNameMap.set(flow.flowId, flow.flowName);
          });
        } else {
          this.$message.error('获取工作流列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取工作流列表失败: ' + error.message);
      }
    },

    getFlowName(flowId) {
      return this.flowIdToNameMap.get(flowId) || '未分配';
    },

    handleFilterChange() {
      this.pagination.pageNum = 1;
      this.fetchNodes();
    },

    resetFilters() {
      this.filterFlowId = null;
      this.pagination.pageNum = 1;
      this.fetchNodes();
    },

    handleAdd() {
      this.resetForm();
      this.dialogTitle = '新增节点';
      this.dialogVisible = true;
    },

    handleEdit(row) {
      this.form = JSON.parse(JSON.stringify(row));
      this.dialogTitle = '编辑节点';
      this.dialogVisible = true;
    },

    handleCopy(row) {
      const copied = JSON.parse(JSON.stringify(row));
      copied.nodeId = '';
      copied.nodeName = `${copied.nodeName}（副本）`;
      copied.flowId = null;
      copied.scheduleExpr = '';
      copied.paramFilterExpr = '';
      copied.keywordField = '';

      this.form = copied;
      this.dialogTitle = '复制节点';
      this.dialogVisible = true;
    },

    handleDelete(row) {
      this.$confirm(`确定要删除节点 "${row.nodeName}" 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await request.delete(`/v1/console/node/${row.nodeId}`);
          this.$message.success('删除成功');
          this.fetchNodes();
        } catch (error) {
          this.$message.error('删除失败: ' + error.message);
        }
      }).catch(() => {});
    },

    // 新增：全量删除配置方法
    handleDeleteAllConfig(row) {
      this.$confirm(`确定要全量删除节点 "${row.nodeName}" 的所有配置吗? 此操作不可恢复!`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(async () => {
        try {
          await request.delete(`/v1/console/node/${row.nodeId}/delete-all-config`);
          this.$message.success('全量删除配置成功');
          this.fetchNodes(); // 刷新列表
        } catch (error) {
          this.$message.error('全量删除配置失败: ' + error.message);
        }
      }).catch(() => {});
    },

    async exportNodeParams(row) {
      if (!row.nodeId) {
        this.$message.error('节点ID不存在，无法导出参数配置');
        return;
      }

      try {
        this.loading = true;
        const response = await request.get(`/v1/console/node/export/${row.nodeId}`);

        if (response.status !== 200 || response.data.code !== '200') {
          const errorMsg = response.data?.message || '导出接口响应异常';
          this.$message.error(`参数配置导出失败: ${ errorMsg }`);
          return;
        }

        const exportData = response.data.rsp;
        if (!exportData) {
          this.$message.info('该节点没有参数配置数据');
          return;
        }

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json; charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${row.nodeName}_参数配置_${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.$message.success('参数配置导出成功');
      } catch (error) {
        const errorMsg = error?.message || '未知错误';
        this.$message.error(`参数配置导出失败: ${ errorMsg }`);
      } finally {
        this.loading = false;
      }
    },

    // 处理文件上传（适配动态 input）
    handleImportClick(row) {
      this.currentNode = row;
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
          this.handleFileUpload(e);
        }
      };
      fileInput.click();
    },

    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        this.$message.error('请上传JSON格式的文件');
        return;
      }

      try {
        this.loading = true;
        const formData = new FormData();
        formData.append('nodeId', this.currentNode.nodeId);
        formData.append('file', file);

        const response = await request.post('/v1/console/node/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.status === 200 && response.data.code === '200') {
          this.$message.success('参数配置导入成功');
        } else {
          this.$message.error('参数配置导入失败: ' + (response.data.message || '未知错误'));
        }
      } catch (error) {
        this.$message.error('参数配置导入失败: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    resetForm() {
      this.$refs.form?.resetFields();
      this.form = {
        nodeId: '',
        nodeName: '',
        flowId: null,
        nodeType: 'HTTP',
        metaInfo: '{}',
        scheduleParamSourceType: '',
        scheduleExpr: '',
        paramFilterExpr: '',
        keywordField: ''
      };
    },

    submitForm() {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          const submitData = { ...this.form };
          Object.keys(submitData).forEach(key => {
            if (submitData[key] === '') {
              submitData[key] = null;
            }
          });

          try {
            let response;
            if (this.form.nodeId) {
              response = await request.post('/v1/console/node/update', submitData);
            } else {
              response = await request.post('/v1/console/node/create', submitData);
            }

            if (response.status === 200 && response.data.code === '200') {
              this.$message.success('保存成功');
              this.dialogVisible = false;
              this.fetchNodes();
            } else {
              this.$message.error('保存失败: ' + response.data.message);
            }
          } catch (error) {
            this.$message.error('保存失败: ' + error.message);
          }
        }
      });
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.pageNum = 1;
      this.fetchNodes();
    },

    handleCurrentChange(val) {
      this.pagination.pageNum = val;
      this.fetchNodes();
    },

    formatJsonPreview(str) {
      try {
        if (!str) return '无数据';
        const obj = JSON.parse(str);
        const formatted = JSON.stringify(obj, null, 2);
        const lines = formatted.split('\n');
        if (lines.length > 3) {
          return [...lines.slice(0, 3), '  ...'].join('\n');
        }
        return formatted;
      } catch (e) {
        return str.length > 100 ? str.substring(0, 100) + '...' : str;
      }
    },

    openJsonDialog(jsonStr, title) {
      this.jsonDialogTitle = title;
      this.currentJson = jsonStr || '';
      try {
        this.parsedJson = jsonStr ? JSON.parse(jsonStr) : null;
      } catch (e) {
        this.parsedJson = { error: 'Invalid JSON format', content: jsonStr };
      }
      this.jsonDialogVisible = true;
    },

    copyJson() {
      const text = this.currentJson || '';
      if (!text) {
        this.$message.warning('无内容可复制');
        return;
      }

      // 尝试使用 navigator.clipboard（现代浏览器）
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text)
          .then(() => {
            this.$message.success('已复制到剪贴板');
          })
          .catch(err => {
            console.error('Clipboard error:', err);
            // 如果失败，尝试 fallback 到 execCommand
            this.fallbackCopy(text);
          });
      } else {
        // Fallback to execCommand（兼容旧浏览器）
        this.fallbackCopy(text);
      }
    },

    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);

      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success('已复制到剪贴板');
      } catch (err) {
        this.$message.error('复制失败，请手动复制');
      }

      document.body.removeChild(textarea);
    },

    resetJsonDialog() {
      this.parsedJson = null;
      this.currentJson = '';
      this.jsonDialogTitle = '';
    }
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

.json-container {
  position: relative;
  cursor: pointer;
}

.json-preview {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 80px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  transition: all 0.2s;
}

.json-container:hover .json-preview {
  background-color: #eee;
}

.json-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.json-container:hover .json-overlay {
  opacity: 1;
}

.json-detail-container {
  max-height: 60vh;
  overflow: auto;
  padding: 10px;
  background-color: #fff;
}

.left-aligned-json {
  text-align: left !important;
  padding: 0 !important;
  margin: 0 !important;
}
</style>