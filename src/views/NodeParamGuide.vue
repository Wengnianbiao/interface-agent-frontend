<template>
  <div class="node-param-guide">
    <p class="intro">
      下方通过三个典型示例，以"源数据 → 参数配置 → 目标结构"的方式，
      动态展示如何为 <strong>基础类型</strong>、<strong>对象</strong> 和 <strong>数组</strong> 配置映射。
    </p>

    <el-tabs v-model="activeTab">
      <!-- 基础类型映射示例 -->
      <el-tab-pane label="基础类型映射" name="basic">
        <div class="demo-toolbar">
          <el-button size="mini" type="primary" @click="playDemo('basic')">自动播放</el-button>
          <el-button size="mini" @click="stopDemo('basic')">停止</el-button>
        </div>
        <el-row :gutter="20" class="demo-row">
          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header">源数据示例</div>
              <div class="demo-section">
                <p>假设节点入参结构中包含：</p>
                <ul class="demo-list">
                  <li :class="{ highlight: basicStep === 1 }">request.patientId : STRING</li>
                  <li :class="{ highlight: basicStep === 2 }">request.name : STRING</li>
                </ul>
                <p class="tips">目标：将这两个字段映射到下游接口的 patientId、patientName 字段。</p>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header">配置步骤</div>
              <el-steps :active="basicStep" direction="vertical">
                <el-step title="选择节点与处理类型" description="选中对应工作流节点，选择前置/后置处理类型。" />
                <el-step title="配置 patientId 映射" description="源参数：request.patientId，目标参数：patientId，映射类型：值映射。" />
                <el-step title="配置 patientName 映射" description="源参数：request.name，目标参数：patientName，映射类型：值映射。" />
              </el-steps>

              <div class="table-wrapper">
                <el-table :data="basicConfigRows" size="mini" border>
                  <el-table-column label="源参数路径" prop="source">
                    <template slot-scope="scope">
                      <span :class="{ highlight: basicStep === scope.row.step }">{{ scope.row.source }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="目标参数名" prop="target">
                    <template slot-scope="scope">
                      <span :class="{ highlight: basicStep === scope.row.step }">{{ scope.row.target }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="源类型" prop="sourceType" width="90" />
                  <el-table-column label="目标类型" prop="targetType" width="90" />
                  <el-table-column label="映射类型" prop="mappingType" width="90" />
                </el-table>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header">目标结构效果</div>
              <div class="demo-section">
                <p>经过映射配置后，下游接口收到的结构类似：</p>
                <pre class="code-block">
{
  <span :class="{ highlight: basicStep === 2 }">"patientId": "123456"</span>,
  <span :class="{ highlight: basicStep === 3 }">"patientName": "张三"</span>
}
                </pre>
                <p class="tips">当前高亮字段即为本步骤重点配置的映射目标。</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 对象映射示例 -->
      <el-tab-pane label="对象映射" name="object">
        <div class="demo-toolbar">
          <el-button size="mini" type="primary" @click="playDemo('object')">自动播放</el-button>
          <el-button size="mini" @click="stopDemo('object')">停止</el-button>
        </div>
        <el-row :gutter="20" class="demo-row">
          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header">源数据示例</div>
              <div class="demo-section">
                <p>假设上游响应体中有：</p>
                <pre class="code-block">
{
  "data": {
    <span :class="{ highlight: objectStep === 2 }">"patient": {
      "id": "123456",
      "name": "张三"
    }</span>
  }
}
                </pre>
                <p class="tips">目标：把整个 patient 对象映射为下游的 patientInfo 对象，子字段再做细粒度映射。</p>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header">配置步骤</div>
              <el-steps :active="objectStep" direction="vertical">
                <el-step title="配置父对象映射" description="目标参数 patientInfo，类型为 OBJECT，映射来源选择上游响应。" />
                <el-step title="配置 id 子字段" description="父参数选择 patientInfo，源 data.patient.id，目标 patientInfo.id。" />
                <el-step title="配置 name 子字段" description="父参数选择 patientInfo，源 data.patient.name，目标 patientInfo.name。" />
              </el-steps>

              <div class="table-wrapper">
                <el-table :data="objectConfigRows" size="mini" border>
                  <el-table-column label="父参数" prop="parent">
                    <template slot-scope="scope">
                      <span :class="{ highlight: objectStep === scope.row.step }">{{ scope.row.parent }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="源参数路径" prop="source">
                    <template slot-scope="scope">
                      <span :class="{ highlight: objectStep === scope.row.step }">{{ scope.row.source }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="目标参数名" prop="target" />
                  <el-table-column label="目标类型" prop="targetType" width="90" />
                </el-table>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header">目标结构效果</div>
              <div class="demo-section">
                <pre class="code-block">
{
  <span :class="{ highlight: objectStep === 1 }">"patientInfo": {
    <span :class="{ highlight: objectStep === 2 }">"id": "123456"</span>,
    <span :class="{ highlight: objectStep === 3 }">"name": "张三"</span>
  }</span>
}
                </pre>
                <p class="tips">对象型参数一般通过“父参数 + 子字段”组合配置，使用父参数形成嵌套结构。</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 数组映射示例 -->
      <el-tab-pane label="数组映射" name="array">
        <div class="demo-toolbar">
          <el-button size="mini" type="primary" @click="playDemo('array')">自动播放</el-button>
          <el-button size="mini" @click="stopDemo('array')">停止</el-button>
        </div>
        <el-row :gutter="20" class="demo-row">
          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header">源数据示例</div>
              <div class="demo-section">
                <p>假设上游响应体中有一个数组：</p>
                <pre class="code-block">
{
  "data": {
    <span :class="{ highlight: arrayStep === 2 }">"items": [
      { "id": "A01", "qty": 1 },
      { "id": "A02", "qty": 2 }
    ]</span>
  }
}
                </pre>
                <p class="tips">目标：将 items 数组映射为下游的 orderItems 数组，并分别映射 id 与 qty 字段。</p>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header">配置步骤</div>
              <el-steps :active="arrayStep" direction="vertical">
                <el-step title="配置数组父参数" description="目标参数 orderItems，类型为 ARRAY / PURE_ARRAY，根据实际选择。" />
                <el-step title="配置元素 id 映射" description="父参数选择 orderItems，源 data.items[].id，目标 orderItems[].id。" />
                <el-step title="配置元素 qty 映射" description="父参数选择 orderItems，源 data.items[].qty，目标 orderItems[].qty。" />
              </el-steps>

              <div class="table-wrapper">
                <el-table :data="arrayConfigRows" size="mini" border>
                  <el-table-column label="父参数" prop="parent">
                    <template slot-scope="scope">
                      <span :class="{ highlight: arrayStep === scope.row.step }">{{ scope.row.parent }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="源参数路径" prop="source">
                    <template slot-scope="scope">
                      <span :class="{ highlight: arrayStep === scope.row.step }">{{ scope.row.source }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="目标参数名" prop="target" />
                  <el-table-column label="目标类型" prop="targetType" width="90" />
                </el-table>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header">目标结构效果</div>
              <div class="demo-section">
                <pre class="code-block">
{
  <span :class="{ highlight: arrayStep === 1 }">"orderItems": [
    {
      <span :class="{ highlight: arrayStep === 2 }">"id": "A01"</span>,
      <span :class="{ highlight: arrayStep === 3 }">"qty": 1</span>
    },
    {
      "id": "A02",
      "qty": 2
    }
  ]</span>
}
                </pre>
                <p class="tips">数组类映射的关键在于：父参数定义数组本身，子参数定义单个元素内部的字段。</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'NodeParamGuide',
  data() {
    return {
      activeTab: 'basic',
      basicStep: 1,
      objectStep: 1,
      arrayStep: 1,
      basicMaxStep: 3,
      objectMaxStep: 3,
      arrayMaxStep: 3,
      timers: {
        basic: null,
        object: null,
        array: null
      },
      basicConfigRows: [
        {
          step: 2,
          source: 'request.patientId',
          target: 'patientId',
          sourceType: 'STRING',
          targetType: 'STRING',
          mappingType: 'NAME'
        },
        {
          step: 3,
          source: 'request.name',
          target: 'patientName',
          sourceType: 'STRING',
          targetType: 'STRING',
          mappingType: 'NAME'
        }
      ],
      objectConfigRows: [
        {
          step: 1,
          parent: '-',
          source: 'data.patient',
          target: 'patientInfo',
          targetType: 'OBJECT'
        },
        {
          step: 2,
          parent: 'patientInfo',
          source: 'data.patient.id',
          target: 'id',
          targetType: 'STRING'
        },
        {
          step: 3,
          parent: 'patientInfo',
          source: 'data.patient.name',
          target: 'name',
          targetType: 'STRING'
        }
      ],
      arrayConfigRows: [
        {
          step: 1,
          parent: '-',
          source: 'data.items',
          target: 'orderItems',
          targetType: 'ARRAY'
        },
        {
          step: 2,
          parent: 'orderItems',
          source: 'data.items[].id',
          target: 'id',
          targetType: 'STRING'
        },
        {
          step: 3,
          parent: 'orderItems',
          source: 'data.items[].qty',
          target: 'qty',
          targetType: 'INTEGER'
        }
      ]
    };
  },
  methods: {
    playDemo(type) {
      this.stopDemo(type);
      this.resetStep(type);
      this.timers[type] = setInterval(() => {
        this.nextStep(type);
      }, 1600);
    },
    stopDemo(type) {
      if (this.timers[type]) {
        clearInterval(this.timers[type]);
        this.timers[type] = null;
      }
    },
    resetStep(type) {
      if (type === 'basic') {
        this.basicStep = 1;
      } else if (type === 'object') {
        this.objectStep = 1;
      } else if (type === 'array') {
        this.arrayStep = 1;
      }
    },
    nextStep(type) {
      if (type === 'basic') {
        this.basicStep = this.basicStep >= this.basicMaxStep ? 1 : this.basicStep + 1;
      } else if (type === 'object') {
        this.objectStep = this.objectStep >= this.objectMaxStep ? 1 : this.objectStep + 1;
      } else if (type === 'array') {
        this.arrayStep = this.arrayStep >= this.arrayMaxStep ? 1 : this.arrayStep + 1;
      }
    }
  },
  beforeDestroy() {
    this.stopDemo('basic');
    this.stopDemo('object');
    this.stopDemo('array');
  }
};
</script>

<style scoped>
.node-param-guide {
  padding: 20px;
  text-align: left;
}

.node-param-guide h2 {
  margin-bottom: 10px;
}

.intro {
  margin-bottom: 20px;
  color: #606266;
}

.demo-row {
  margin-top: 10px;
}

.demo-section {
  font-size: 13px;
  line-height: 1.6;
}

.demo-list {
  padding-left: 18px;
}

.demo-list li {
  margin-bottom: 4px;
}

.tips {
  margin-top: 10px;
  color: #909399;
}

.code-block {
  background: #1e1e1e;
  color: #f8f8f2;
  padding: 10px 12px;
  border-radius: 4px;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
}

.code-block span.highlight {
  background-color: rgba(255, 208, 75, 0.25);
}

.highlight {
  background-color: rgba(255, 208, 75, 0.25);
  transition: background-color 0.4s ease;
}

.table-wrapper {
  margin-top: 16px;
}

.demo-toolbar {
  margin-bottom: 8px;
}
</style>
