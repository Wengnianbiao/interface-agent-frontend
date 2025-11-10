<template>
  <div class="invoke-log">
    <h2>接口调用日志</h2>

    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="接口名称">
        <!-- 改为支持输入+下拉的组合框 -->
        <el-autocomplete
          v-model="searchForm.nodeName"
          :fetch-suggestions="queryNodeName"
          placeholder="请选择或输入接口名称"
          clearable
          @select="handleNodeSelect"
        ></el-autocomplete>
      </el-form-item>

      <el-form-item label="关键字">
        <el-input v-model="searchForm.keyword" placeholder="请输入关键字" clearable></el-input>
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
          {{ scope.row.nodeName || scope.row.nodeId || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="关键字" min-width="150">
        <template #default="scope">
          {{ scope.row.keyword || '-' }}
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

    <!-- JSON/XML详情弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="jsonDialogVisible"
      width="80%"
      top="20px"
      @close="resetJsonDialog"
    >
      <div class="json-detail-container">
        <!-- 根据内容类型决定展示方式 -->
        <div v-if="isXmlContent">
          <div class="xml-container">
            <pre class="xml-preview">{{ currentJson }}</pre>
          </div>
        </div>
        <div v-else>
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
    JsonViewer
  },
  data() {
    return {
      searchForm: {
        nodeName: '', // 改为nodeName查询
        keyword: ''
      },
      logList: [],
      loading: false,
      pagination: {
        total: 0,
        pageNum: 1,
        pageSize: 10
      },
      jsonDialogVisible: false,
      dialogTitle: '',
      currentJson: '',
      parsedJson: null,
      nodeOptions: [], // 存储所有节点名称列表
      isXmlContent: false // 控制是否为 XML 内容
    };
  },
  mounted() {
    this.fetchNodeList();
  },
  methods: {
    async fetchNodeList() {
      try {
        const response = await fetchNodeList();
        if (response.status === 200 && response.data.code === '200') {
          this.nodeOptions = response.data.rsp || [];
          // 初始化时默认加载所有日志
          this.fetchLogList();
        } else {
          this.$message.error('获取节点列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取节点列表失败: ' + error.message);
      }
    },

    async fetchLogList() {
      this.loading = true;
      try {
        const params = {
          nodeName: this.searchForm.nodeName || undefined, // 传递nodeName参数
          keyword: this.searchForm.keyword || undefined,
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

    handleSearch() {
      this.pagination.pageNum = 1;
      this.fetchLogList();
    },

    handleReset() {
      this.searchForm.nodeName = ''; // 重置nodeName
      this.searchForm.keyword = '';
      this.pagination.pageNum = 1;
      this.fetchLogList();
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.pageNum = 1;
      this.fetchLogList();
    },

    handleCurrentChange(val) {
      this.pagination.pageNum = val;
      this.fetchLogList();
    },

    // 搜索节点名称建议
    queryNodeName(queryString, callback) {
      if (!this.nodeOptions.length) {
        callback([]);
        return;
      }
      // 过滤包含查询字符串的节点名称
      const results = this.nodeOptions.filter(node => 
        node.nodeName.toLowerCase().includes(queryString.toLowerCase())
      ).map(node => ({
        value: node.nodeName,
        label: node.nodeName
      }));
      callback(results);
    },

    // 选择节点名称回调
    handleNodeSelect(item) {
      this.searchForm.nodeName = item.value;
    },

    formatJsonPreview(str) {
      if (!str) return '无数据';

      // 判断是否为 XML
      const isXml = str.trim().startsWith('<') && str.trim().endsWith('>');

      if (isXml) {
        return str.length > 100 ? str.substring(0, 100) + '...' : str;
      }

      try {
        const obj = JSON.parse(str);
        const formatted = JSON.stringify(obj, null, 2);
        const lines = formatted.split('\n');
        return lines.length > 5 ? [...lines.slice(0, 5), '  ...'].join('\n') : formatted;
      } catch (e) {
        return str.length > 100 ? str.substring(0, 100) + '...' : str;
      }
    },

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

    openJsonDialog(jsonStr, title) {
      this.dialogTitle = title;
      this.currentJson = jsonStr || '';
      this.isXmlContent = false;

      if (!jsonStr) {
        this.parsedJson = null;
        this.jsonDialogVisible = true;
        return;
      }

      // 判断是否为 XML
      const isXml = jsonStr.trim().startsWith('<') && jsonStr.trim().endsWith('>');
      if (isXml) {
        this.isXmlContent = true;
        this.parsedJson = null;
      } else {
        try {
          this.parsedJson = JSON.parse(jsonStr);
        } catch (e) {
          this.parsedJson = { error: 'Invalid JSON format', content: jsonStr };
        }
      }

      this.jsonDialogVisible = true;
    },

    copyJson() {
      const text = this.currentJson || '';
      if (!text) {
        this.$message.warning('无内容可复制');
        return;
      }

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text)
          .then(() => {
            this.$message.success('已复制到剪贴板');
          })
          .catch(err => {
            console.warn('Clipboard API failed:', err);
            this.fallbackCopy(text);
          });
      } else {
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
      textarea.style.fontSize = '12px';
      document.body.appendChild(textarea);

      try {
        textarea.select();
        const successful = document.execCommand('copy');
        if (successful) {
          this.$message.success('已复制到剪贴板');
        } else {
          this.$message.error('复制失败，请手动复制');
        }
      } catch (err) {
        this.$message.error('复制失败，请手动复制');
      }

      document.body.removeChild(textarea);
    },

    resetJsonDialog() {
      this.parsedJson = null;
      this.currentJson = '';
      this.dialogTitle = '';
      this.isXmlContent = false;
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

/* XML 预览样式 */
.xml-container {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  color: #333;
}

.xml-preview {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  text-align: left !important;
  color: #333;
}

/* JSON详情弹窗样式 */
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

/*  autocomplete 样式优化 */
.el-autocomplete {
  width: 240px;
}
</style>