<template>
  <div class="mock-invoke">
    <h2>Mock调用测试</h2>

    <el-card class="invoke-card">
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-width="120px"
      >
        <el-form-item label="选择节点" prop="nodeId">
          <el-select 
            v-model="form.nodeId" 
            placeholder="请选择节点"
            filterable
            style="width: 100%"
            @change="handleNodeChange"
          >
            <el-option
              v-for="node in nodeOptions"
              :key="node.nodeId"
              :label="node.nodeName"
              :value="node.nodeId"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="选择Mock场景" prop="mockId">
          <el-select 
            v-model="form.mockId" 
            placeholder="请先选择节点"
            filterable
            style="width: 100%"
            :disabled="!form.nodeId"
          >
            <el-option
              v-for="mock in mockOptions"
              :key="mock.mockId"
              :label="mock.caseName"
              :value="mock.mockId"
            >
              <span>{{ mock.caseName }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ mock.enabled ? '启用' : '禁用' }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="业务数据" prop="businessData">
          <div style="margin-bottom: 10px;">
            <el-dropdown @command="applyJarvisTemplate">
              <el-button size="small">
                应用Jarvis模板<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="CreateArchives">建档模板</el-dropdown-item>
                <el-dropdown-item command="GetArchives">获取档案模板</el-dropdown-item>
                <el-dropdown-item command="UpdateArchives">更新档案模板</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <el-input
            v-model="form.businessData"
            type="textarea"
            :rows="10"
            placeholder='请输入JSON格式的业务数据，例：{"userId": "123", "orderId": "456"}'
          ></el-input>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            输入的业务数据将作为请求参数传递给Mock节点
          </div>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleInvoke"
            :loading="invoking"
          >
            {{ invoking ? '调用中...' : '调用Mock' }}
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleFormat">格式JSON</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 响应结果 -->
    <el-card class="result-card" v-if="responseData">
      <div slot="header" class="clearfix">
        <span>响应结果</span>
        <el-button 
          style="float: right; padding: 3px 10px" 
          size="small" 
          @click="copyResponse"
        >
          复制
        </el-button>
      </div>
      <div class="response-content">
        <json-viewer
          v-if="parsedResponse"
          :value="parsedResponse"
          :expand-depth="3"
          copyable
          boxed
          sort
        ></json-viewer>
        <pre v-else>{{ responseData }}</pre>
      </div>
    </el-card>

    <!-- 错误信息 -->
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      closable
      @close="errorMessage = ''"
      style="margin-top: 20px"
    >
    </el-alert>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { Message } from 'element-ui';
import { getNodeListUnpaged } from '@/api/workflownode';
import { getMockConfigsByNodeId, invokeMock } from '@/api/mock';
import { jarvisTemplates } from '@/config/jarvisTemplates';
import JsonViewer from 'vue-json-viewer';
import 'vue-json-viewer/style.css';

export default {
  name: 'MockInvoke',
  components: {
    JsonViewer
  },
  setup() {
    const formRef = ref(null);
    const nodeOptions = ref([]);
    const mockOptions = ref([]);
    const invoking = ref(false);
    const responseData = ref(null);
    const parsedResponse = ref(null);
    const errorMessage = ref('');

    const form = reactive({
      nodeId: null,
      mockId: null,
      businessData: '{}'
    });

    const validateJson = (rule, value, callback) => {
      if (!value || value.trim() === '') {
        callback(new Error('请输入业务数据'));
        return;
      }
      try {
        JSON.parse(value);
        callback();
      } catch (error) {
        callback(new Error('请输入有效的JSON格式'));
      }
    };

    const rules = {
      nodeId: [
        { required: true, message: '请选择节点', trigger: 'change' }
      ],
      mockId: [
        { required: true, message: '请选择Mock场景', trigger: 'change' }
      ],
      businessData: [
        { required: true, message: '请输入业务数据', trigger: 'blur' },
        { validator: validateJson, trigger: 'blur' }
      ]
    };

    const loadNodeList = async () => {
      try {
        const response = await getNodeListUnpaged();
        if (response.status === 200 && response.data.code === '200') {
          nodeOptions.value = response.data.rsp || [];
        }
      } catch (error) {
        console.error('获取节点列表失败:', error);
        Message.error('获取节点列表失败');
      }
    };

    const handleNodeChange = async (nodeId) => {
      form.mockId = null;
      mockOptions.value = [];
      
      if (!nodeId) return;

      try {
        const response = await getMockConfigsByNodeId(nodeId);
        if (response.status === 200 && response.data.code === '200') {
          mockOptions.value = response.data.rsp || [];
        }
      } catch (error) {
        console.error('获取Mock配置失败:', error);
        Message.error('获取Mock配置列表失败');
      }
    };

    const handleInvoke = async () => {
      const valid = await formRef.value.validate().catch(() => false);
      if (!valid) return;

      invoking.value = true;
      responseData.value = null;
      parsedResponse.value = null;
      errorMessage.value = '';

      try {
        const businessData = JSON.parse(form.businessData);
        const response = await invokeMock(form.nodeId, form.mockId, businessData);
        
        if (response.status === 200 && response.data.code === '200') {
          responseData.value = JSON.stringify(response.data.rsp, null, 2);
          parsedResponse.value = response.data.rsp;
          Message.success('Mock调用成功');
        } else {
          errorMessage.value = response.data.msg || 'Mock调用失败';
        }
      } catch (error) {
        console.error('Mock调用失败:', error);
        errorMessage.value = error.message || 'Mock调用失败';
      } finally {
        invoking.value = false;
      }
    };

    const handleReset = () => {
      formRef.value?.resetFields();
      form.nodeId = null;
      form.mockId = null;
      form.businessData = '{}';
      mockOptions.value = [];
      responseData.value = null;
      parsedResponse.value = null;
      errorMessage.value = '';
    };

    const handleFormat = () => {
      try {
        const obj = JSON.parse(form.businessData);
        form.businessData = JSON.stringify(obj, null, 2);
        Message.success('JSON格式化成功');
      } catch (error) {
        Message.error('请输入有效的JSON格式');
      }
    };

    const applyJarvisTemplate = (templateName) => {
      const template = jarvisTemplates[templateName];
      if (template) {
        form.businessData = JSON.stringify(template, null, 2);
        Message.success(`已应用${templateName}模板`);
      }
    };

    const copyResponse = async () => {
      if (!responseData.value) return;
      
      try {
        await navigator.clipboard.writeText(responseData.value);
        Message.success('复制成功');
      } catch (error) {
        // fallback
        const textarea = document.createElement('textarea');
        textarea.value = responseData.value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          Message.success('复制成功');
        } catch (err) {
          Message.error('复制失败');
        }
        document.body.removeChild(textarea);
      }
    };

    onMounted(() => {
      loadNodeList();
    });

    return {
      form,
      formRef,
      rules,
      nodeOptions,
      mockOptions,
      invoking,
      responseData,
      parsedResponse,
      errorMessage,
      handleNodeChange,
      handleInvoke,
      handleReset,
      handleFormat,
      copyResponse,
      applyJarvisTemplate
    };
  }
};
</script>

<style scoped>
.mock-invoke {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
}

.invoke-card {
  margin-bottom: 20px;
}

.result-card {
  margin-top: 20px;
}

.response-content {
  max-height: 600px;
  overflow: auto;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.response-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
