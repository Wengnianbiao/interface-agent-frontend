<template>
  <div class="invoke-log">
    <h2>接口调用日志</h2>

    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="接口名称">
        <el-select v-model="searchForm.nodeId" placeholder="请选择接口" clearable>
          <el-option label="全部" value=""></el-option>
          <el-option v-for="node in nodeOptions" :key="node.nodeId" :label="node.nodeName" :value="node.nodeId"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 日志表格 -->
    <el-table :data="logList" style="width: 100%" v-loading="loading">
      <el-table-column label="接口名称" min-width="150">
        <template #default="scope">
          {{ nodeMap.get(scope.row.nodeId) || scope.row.nodeId }}
        </template>
      </el-table-column>
      
      <!-- 上游业务数据 -->
      <el-table-column label="上游业务数据" min-width="220">
        <template #default="scope">
          <div class="json-container" @click="openJsonDialog(scope.row.businessData, '上游业务数据')">
            <pre class="json-preview">{{ formatJsonPreview(scope.row.businessData) }}</pre>
            <div class="json-overlay">点击查看详情</div>
          </div>
        </template>
      </el-table-column>

      <!-- 接口调用入参 -->
      <el-table-column label="接口调用入参" min-width="220">
        <template #default="scope">
          <div class="json-container" @click="openJsonDialog(scope.row.paramBeforeInvoke, '接口调用入参')">
            <pre class="json-preview">{{ formatJsonPreview(scope.row.paramBeforeInvoke) }}</pre>
            <div class="json-overlay">点击查看详情</div>
          </div>
        </template>
      </el-table-column>

      <!-- 接口原始响应 -->
      <el-table-column label="接口原始响应" min-width="220">
        <template #default="scope">
          <div class="json-container" @click="openJsonDialog(scope.row.remoteInvokeResponse, '接口原始响应')">
            <pre class="json-preview">{{ formatJsonPreview(scope.row.remoteInvokeResponse) }}</pre>
            <div class="json-overlay">点击查看详情</div>
          </div>
        </template>
      </el-table-column>

      <!-- 响应上游数据 -->
      <el-table-column label="响应上游数据" min-width="220">
        <template #default="scope">
          <div class="json-container" @click="openJsonDialog(scope.row.paramAfterInvoke, '响应上游数据')">
            <pre class="json-preview">{{ formatJsonPreview(scope.row.paramAfterInvoke) }}</pre>
            <div class="json-overlay">点击查看详情</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="接口耗时" min-width="180">
        <template #default="scope">
          {{ scope.row.invokeTime }} ms
        </template>
      </el-table-column>
      
      <el-table-column label="调用时间" min-width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
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

    <!-- 数据为空时的提示 -->
    <div v-if="!loading && logList.length === 0" style="text-align: center; padding: 20px; color: #999;">
      暂无调用日志数据
    </div>

    <!-- JSON详情弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="jsonDialogVisible"
      width="80%"
      top="20px"
      @close="resetJsonDialog"
    >
      <div class="json-detail-container">
        <!-- 使用vue-json-viewer展示格式化、高亮和可折叠的JSON -->
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
import { fetchLogList, fetchNodeList } from '@/api/invokeLog';
import JsonViewer from 'vue-json-viewer'; // 导入JSON查看器组件

export default {
  name: 'InvokeLog',
  components: {
    JsonViewer // 注册组件
  },
  data() {
    return {
      searchForm: {
        nodeId: ''
      },
      logList: [],
      loading: false,
      pagination: {
        total: 0,
        pageNum: 1,
        pageSize: 10
      },
      // JSON弹窗相关
      jsonDialogVisible: false,
      dialogTitle: '',
      currentJson: '',
      parsedJson: null, // 解析后的JSON对象
      jsonTheme: 'my-awesome-theme', // 自定义主题名称
      // 节点数据
      nodeOptions: [],
      nodeMap: new Map()
    };
  },
  mounted() {
    this.fetchNodeList();
  },
  methods: {
    // 获取节点列表
    async fetchNodeList() {
      try {
        const response = await fetchNodeList();
        if (response.status === 200 && response.data.code === '200') {
          this.nodeOptions = response.data.rsp || [];
          this.nodeMap = new Map();
          this.nodeOptions.forEach(node => {
            this.nodeMap.set(node.nodeId, node.nodeName);
          });
          this.fetchLogList();
        } else {
          this.$message.error('获取节点列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取节点列表失败: ' + error.message);
      }
    },

    // 获取日志列表
    async fetchLogList() {
      this.loading = true;
      try {
        const params = {
          nodeId: this.searchForm.nodeId || undefined,
          pageNum: this.pagination.pageNum,
          pageSize: this.pagination.pageSize
        };
        const response = await fetchLogList(params);
        if (response.status === 200 && response.data.code === '200') {
          const pageList = response.data.rsp;
          this.logList = pageList.rows || [];
          this.pagination.total = pageList.total || 0;
        } else {
          this.$message.error('获取调用日志列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取调用日志列表失败: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    // 搜索
    handleSearch() {
      this.pagination.pageNum = 1;
      this.fetchLogList();
    },

    // 重置
    handleReset() {
      this.searchForm.nodeId = '';
      this.pagination.pageNum = 1;
      this.fetchLogList();
    },

    // 分页大小改变
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.pageNum = 1;
      this.fetchLogList();
    },

    // 页码改变
    handleCurrentChange(val) {
      this.pagination.pageNum = val;
      this.fetchLogList();
    },

    // 格式化列表中的JSON预览（限制显示行数）
    formatJsonPreview(str) {
      try {
        if (!str) return '无数据';
        
        const obj = JSON.parse(str);
        const formatted = JSON.stringify(obj, null, 2);
        const lines = formatted.split('\n');
        
        // 只显示前5行，超过的用省略号表示
        if (lines.length > 5) {
          return [...lines.slice(0, 5), '  ...'].join('\n');
        }
        return formatted;
      } catch (e) {
        // 不是JSON格式的字符串，直接显示前100个字符
        return str.length > 100 ? str.substring(0, 100) + '...' : str;
      }
    },

    // 格式化时间戳，精确到毫秒
    formatDateTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    },

    // 打开JSON弹窗
    openJsonDialog(jsonStr, title) {
      this.dialogTitle = title;
      this.currentJson = jsonStr || '';
      
      // 解析JSON
      try {
        this.parsedJson = jsonStr ? JSON.parse(jsonStr) : null;
      } catch (e) {
        this.parsedJson = { error: 'Invalid JSON format', content: jsonStr };
      }
      
      this.jsonDialogVisible = true;
    },

    // 复制JSON到剪贴板
    copyJson() {
      navigator.clipboard.writeText(this.currentJson || '')
        .then(() => {
          this.$message.success('已复制到剪贴板');
        })
        .catch(err => {
          this.$message.error('复制失败：' + err.message);
        });
    },

    // 重置JSON弹窗
    resetJsonDialog() {
      this.parsedJson = null;
      this.currentJson = '';
      this.dialogTitle = '';
    }
  }
};
</script>

<style scoped>
.invoke-log {
  padding: 20px;
}

.invoke-log h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
}

.search-form {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.el-table {
  margin-top: 10px;
  border: 1px solid #ebeef5;
}

.el-table .cell {
  padding: 12px 10px;
}

/* JSON容器样式 */
.json-container {
  position: relative;
  cursor: pointer;
}

/* 列表中的JSON预览样式 */
.json-preview {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 120px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  transition: all 0.2s;
}

.json-container:hover .json-preview {
  background-color: #eee;
}

/* 悬浮提示层 */
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
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s;
}

.json-container:hover .json-overlay {
  opacity: 1;
}

/* JSON详情弹窗样式 */
.json-detail-container {
  max-height: 60vh;
  overflow: auto;
  padding: 10px;
  background-color: #fff; /* 确保背景为白色 */
}

/* 左对齐JSON样式 */
.left-aligned-json {
  text-align: left !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* 分页样式 */
::v-deep .el-pagination {
  margin-top: 20px;
  text-align: right;
}

/* 空数据提示 */
.empty-tip {
  text-align: center;
  padding: 50px 0;
  color: #999;
}

/* 自定义JSON Viewer主题 - 更接近您提供的参考样式 */
::v-deep .my-awesome-theme {
  background: #fff;
  padding: 10px 0; /* 移除左右内边距，增强左对齐效果 */
}

::v-deep .my-awesome-theme .jv-ellipsis {
  color: #999;
}

::v-deep .my-awesome-theme .jv-ellipsis::after {
  content: '...';
}

/* 键名样式 - 改为紫色 */
::v-deep .my-awesome-theme .jv-key {
  color: #800080; /* 紫色 */
  font-weight: normal;
  font-size: 15px; /* 增大字体 */
}

/* 字符串值样式 */
::v-deep .my-awesome-theme .jv-string {
  color: #008000;
  font-size: 15px; /* 增大字体 */
}

/* 数字样式 */
::v-deep .my-awesome-theme .jv-number {
  color: #FF0000;
  font-size: 15px; /* 增大字体 */
}

/* 布尔值样式 */
::v-deep .my-awesome-theme .jv-boolean {
  color: #0000CD;
  font-size: 15px; /* 增大字体 */
}

::v-deep .my-awesome-theme .jv-null {
  color: #999;
  font-size: 15px; /* 增大字体 */
}

::v-deep .my-awesome-theme .jv-array-index {
  color: #666;
  font-weight: bold;
  font-size: 15px; /* 增大字体 */
}

::v-deep .my-awesome-theme .jv-code {
  padding: 0;
  line-height: 1.5;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 15px; /* 增大整体字体大小 */
}

/* 优化折叠/展开按钮样式 */
::v-deep .my-awesome-theme .jv-toggle {
  color: #000;
  cursor: pointer;
  margin-right: 6px;
  font-size: 14px;
  display: inline-block;
  width: 16px;
  height: 16px;
  text-align: center;
  line-height: 14px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background-color: #f5f5f5;
}

/* 展开/折叠图标 */
::v-deep .my-awesome-theme .jv-toggle.jv-toggle-closed::before {
  content: '+';
}

::v-deep .my-awesome-theme .jv-toggle.jv-toggle-open::before {
  content: '-';
}

::v-deep .my-awesome-theme .jv-toggle:hover {
  background-color: #e0e0e0;
  border-color: #999;
}

/* 移除JSON Viewer自带的缩进样式，使用自定义缩进 */
::v-deep .my-awesome-theme .jv-indent {
  display: inline-block;
  margin: 0;
  padding: 0;
}

::v-deep .my-awesome-theme .jv-level {
  margin-left: 20px; /* 统一缩进量 */
}

/* 根节点样式 */
::v-deep .my-awesome-theme .jv-root {
  margin-left: 0 !important;
  padding-left: 0 !important;
}
</style>
