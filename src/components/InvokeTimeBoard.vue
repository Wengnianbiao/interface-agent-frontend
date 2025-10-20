<template>
  <div class="invoke-time-board">
    <!-- 总体统计卡片 -->
    <el-card class="box-card summary-card" shadow="hover">
      <div slot="header" class="clearfix">
        <span>接口调用总体统计</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="refreshData" :loading="loading">
          <i class="el-icon-refresh" /> 刷新
        </el-button>
      </div>
      <div v-loading="loading" class="card-content">
        <div v-if="statsData && statsData.length > 0" class="summary-stats">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">统计次数</div>
              <div class="summary-value">{{ totalStats.count }} 次</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">平均耗时</div>
              <div 
                class="summary-value time-value" 
                :class="getAverageTimeClass(totalStats.averageTime)"
              >
                {{ Math.round(totalStats.averageTime) }} ms
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">最快耗时</div>
              <div class="summary-value time-value time-fast">{{ totalStats.minTime }} ms</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">最慢耗时</div>
              <div class="summary-value time-value time-very-slow">{{ totalStats.maxTime }} ms</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">最近调用</div>
              <div class="summary-value">
                {{ latestLog ? (nodeMap.get(latestLog.nodeId) || latestLog.nodeId) : '无记录' }}
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">调用时间</div>
              <div class="summary-value">
                {{ latestLog ? formatDateTime(latestLog.createTime) : '无记录' }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          暂无调用记录
        </div>
      </div>
    </el-card>

    <!-- 各接口详细统计 -->
    <div v-if="statsData && statsData.length > 0" class="per-interface-stats">
      <h3>各接口调用耗时统计</h3>
      <el-card class="interface-card" shadow="hover" v-for="stat in statsData" :key="stat.nodeId">
        <div class="interface-header">
          <div class="interface-name">{{ stat.name }}</div>
          <div class="interface-id">{{ stat.nodeId }}</div>
        </div>
        <div class="interface-stats">
          <div class="stat-item">
            <div class="stat-label">调用次数</div>
            <div class="stat-value">{{ stat.count }} 次</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均耗时</div>
            <div 
              class="stat-value time-value" 
              :class="getAverageTimeClass(stat.averageTime)"
            >
              {{ Math.round(stat.averageTime) }} ms
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">最快耗时</div>
            <div class="stat-value time-value time-fast">{{ stat.minTime }} ms</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">最慢耗时</div>
            <div 
              class="stat-value time-value" 
              :class="stat.maxTime < 1000 ? 'time-slow' : 'time-very-slow'"
            >
              {{ stat.maxTime }} ms
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { fetchLogList, fetchNodeList } from '@/api/invokeLog';

export default {
  name: 'InvokeTimeBoard',
  data() {
    return {
      latestLog: null,
      statsData: [], // 存储每个接口的统计数据
      totalStats: {
        count: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0
      },
      loading: false,
      nodeMap: new Map(),
      allNodes: [] // 存储所有接口节点
    };
  },
  mounted() {
    this.initData();
  },
  methods: {
    async initData() {
      await this.fetchNodeList();
    },

    async fetchNodeList() {
      try {
        const response = await fetchNodeList();
        if (response.status === 200 && response.data.code === '200') {
          const nodeOptions = response.data.rsp || [];
          this.allNodes = nodeOptions;
          this.nodeMap = new Map();
          nodeOptions.forEach(node => {
            this.nodeMap.set(node.nodeId, node.nodeName);
          });
          await this.fetchStatsData();
        } else {
          this.$message.error('获取节点列表失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取节点列表失败: ' + error.message);
      }
    },

    async fetchStatsData() {
      this.loading = true;
      try {
        const params = {
          pageNum: 1,
          pageSize: 20
        };
        const response = await fetchLogList(params);
        if (response.status === 200 && response.data.code === '200') {
          const pageList = response.data.rsp;
          const logs = pageList.rows || [];
          
          // 获取最新一条记录
          this.latestLog = logs.length > 0 ? logs[0] : null;
          
          // 按 node_id 分组统计每个接口的数据
          const statsByNodeId = new Map();
          
          logs.forEach(log => {
            const nodeId = log.nodeId;
            if (!statsByNodeId.has(nodeId)) {
              statsByNodeId.set(nodeId, {
                count: 0,
                totalTime: 0,
                minTime: Number.MAX_SAFE_INTEGER,
                maxTime: 0
              });
            }
            
            const stats = statsByNodeId.get(nodeId);
            stats.count++;
            stats.totalTime += log.invokeTime;
            stats.minTime = Math.min(stats.minTime, log.invokeTime);
            stats.maxTime = Math.max(stats.maxTime, log.invokeTime);
          });
          
          // 转换为数组，包含每个接口的统计数据
          this.statsData = this.allNodes.map(node => {
            const stats = statsByNodeId.get(node.nodeId) || {
              count: 0,
              totalTime: 0,
              minTime: Number.MAX_SAFE_INTEGER,
              maxTime: 0
            };
            
            return {
              nodeId: node.nodeId,
              name: node.nodeName,
              count: stats.count,
              averageTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
              minTime: stats.minTime === Number.MAX_SAFE_INTEGER ? 0 : stats.minTime,
              maxTime: stats.maxTime
            };
          }).filter(stat => stat.count > 0); // 只显示有调用记录的接口
          
          // 计算总体统计数据
          this.calculateTotalStats();
        } else {
          this.$message.error('获取调用日志失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取调用日志失败: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    // 计算总体统计数据
    calculateTotalStats() {
      if (this.statsData.length === 0) {
        this.totalStats = {
          count: 0,
          averageTime: 0,
          minTime: 0,
          maxTime: 0
        };
        return;
      }
      
      // 计算总调用次数和总耗时
      let totalCount = 0;
      let totalTimeSum = 0;
      let allTimes = [];
      
      this.statsData.forEach(stat => {
        totalCount += stat.count;
        totalTimeSum += stat.averageTime * stat.count;
        
        // 收集所有时间用于计算最小和最大值
        if (stat.count > 0) {
          allTimes.push(stat.minTime);
          allTimes.push(stat.maxTime);
        }
      });
      
      // 计算总体平均值
      const averageTime = totalCount > 0 ? totalTimeSum / totalCount : 0;
      
      // 计算最小和最大耗时
      const minTime = allTimes.length > 0 ? Math.min(...allTimes) : 0;
      const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 0;
      
      this.totalStats = {
        count: totalCount,
        averageTime,
        minTime,
        maxTime
      };
    },

    refreshData() {
      this.fetchStatsData();
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

    // 根据耗时返回对应的样式类名
    getAverageTimeClass(averageTime) {
      if (averageTime < 100) return 'time-fast';
      if (averageTime < 500) return 'time-normal';
      if (averageTime < 1000) return 'time-slow';
      return 'time-very-slow';
    }
  }
};
</script>

<style scoped>
.invoke-time-board {
  margin-bottom: 20px;
  padding: 0 15px;
}

.summary-card {
  margin-bottom: 25px;
}

.per-interface-stats {
  margin-top: 30px;
}

.per-interface-stats h3 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.interface-card {
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.interface-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.interface-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.interface-name {
  font-size: 16px;
  font-weight: 500;
  color: #1f2329;
}

.interface-id {
  font-size: 12px;
  color: #86909c;
}

.card-content {
  min-height: 150px;
  padding: 15px 0;
}

.summary-stats {
  width: 100%;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.summary-item {
  padding: 10px 15px;
  background-color: #f7f8fa;
  border-radius: 4px;
}

.summary-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.interface-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.stat-item {
  padding: 8px 0;
}

.stat-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 3px;
}

.stat-value {
  font-size: 14px;
  color: #303133;
}

.time-value {
  font-weight: bold;
}

.time-fast {
  color: #67c23a; /* 绿色 - 快速 */
}

.time-normal {
  color: #409eff; /* 蓝色 - 正常 */
}

.time-slow {
  color: #e6a23c; /* 橙色 - 较慢 */
}

.time-very-slow {
  color: #f56c6c; /* 红色 - 很慢 */
}

.no-data {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 30px 0;
}

.clearfix::after {
  content: "";
  display: table;
  clear: both;
}
</style>
