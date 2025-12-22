<template>
  <div class="invoke-log">
    <h2>接口调用日志</h2>

    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="接口名称">
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
      
      <el-table-column label="上游业务数据" min-width="220">
        <template #default="scope">
          <json-preview-cell 
            :content="scope.row.businessData" 
            @click="jsonViewer.open($event, '上游业务数据')"
          />
        </template>
      </el-table-column>

      <el-table-column label="接口调用入参" min-width="220">
        <template #default="scope">
          <json-preview-cell 
            :content="scope.row.paramBeforeInvoke" 
            @click="jsonViewer.open($event, '接口调用入参')"
          />
        </template>
      </el-table-column>

      <el-table-column label="接口原始响应" min-width="220">
        <template #default="scope">
          <json-preview-cell 
            :content="scope.row.remoteInvokeResponse" 
            @click="jsonViewer.open($event, '接口原始响应')"
          />
        </template>
      </el-table-column>

      <el-table-column label="响应上游数据" min-width="220">
        <template #default="scope">
          <json-preview-cell 
            :content="scope.row.paramAfterInvoke" 
            @click="jsonViewer.open($event, '响应上游数据')"
          />
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
import { fetchLogList, fetchNodeList } from '@/api/invokeLog';
import { usePagination } from '@/composables/usePagination';
import { useTableLoading } from '@/composables/useTableLoading';
import { useJsonViewer } from '@/composables/useJsonViewer';
import JsonViewerDialog from '@/components/common/JsonViewerDialog.vue';
import JsonPreviewCell from '@/components/common/JsonPreviewCell.vue';

export default {
  name: 'InvokeLog',
  components: {
    JsonViewerDialog,
    JsonPreviewCell
  },
  setup() {
    const searchForm = reactive({
      nodeName: '',
      keyword: ''
    });

    const logList = ref([]);
    const nodeOptions = ref([]);

    const { loading, withLoading } = useTableLoading();
    const jsonViewer = useJsonViewer();

    const fetchData = async () => {
      await withLoading(async () => {
        const params = {
          nodeName: searchForm.nodeName || undefined,
          keyword: searchForm.keyword || undefined,
          pageNum: pagination.pageNum.value,
          pageSize: pagination.pageSize.value
        };
        const response = await fetchLogList(params);
        if (response.status === 200 && response.data.code === '200') {
          const pageList = response.data.rsp;
          logList.value = pageList.rows || [];
          pagination.total.value = pageList.total || 0;
        }
      });
    };

    const pagination = usePagination({ fetchData });

    const loadNodeList = async () => {
      try {
        const response = await fetchNodeList();
        if (response.status === 200 && response.data.code === '200') {
          nodeOptions.value = response.data.rsp || [];
          await fetchData();
        }
      } catch (error) {
        console.error('获取节点列表失败:', error);
      }
    };

    const handleSearch = () => {
      pagination.pageNum.value = 1;
      fetchData();
    };

    const handleReset = () => {
      searchForm.nodeName = '';
      searchForm.keyword = '';
      pagination.pageNum.value = 1;
      fetchData();
    };

    const queryNodeName = (queryString, callback) => {
      if (!nodeOptions.value.length) {
        callback([]);
        return;
      }
      const results = nodeOptions.value
        .filter(node => node.nodeName.toLowerCase().includes(queryString.toLowerCase()))
        .map(node => ({ value: node.nodeName, label: node.nodeName }));
      callback(results);
    };

    const handleNodeSelect = (item) => {
      searchForm.nodeName = item.value;
    };

    const formatDateTime = (timestamp) => {
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
    };

    onMounted(() => {
      loadNodeList();
    });

    return {
      searchForm,
      logList,
      nodeOptions,
      loading,
      pagination,
      jsonViewer,
      handleSearch,
      handleReset,
      queryNodeName,
      handleNodeSelect,
      formatDateTime
    };
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

.el-autocomplete {
  width: 240px;
}
</style>