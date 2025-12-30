<template>
  <div class="jarvis-templates">
    <el-alert
      title="模板说明"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      以下是Jarvis系统的入参模板，可用于Mock调用测试时快速填充业务数据
    </el-alert>

    <el-row :gutter="20">
      <el-col :span="8" v-for="(template, key) in jarvisTemplates" :key="key">
        <el-card class="template-card" shadow="hover">
          <div slot="header" class="card-header">
            <span class="template-title">{{ templateNames[key] }}</span>
          </div>
          
          <div class="template-info">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="BusinessMethod">
                <el-tag size="small">{{ template.BusinessMethod }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="BusinessCode">
                {{ template.BusinessCode || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="说明">
                {{ getTemplateDescription(key) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="template-actions">
            <el-button 
              size="small" 
              type="primary"
              @click="viewTemplate(key)"
              icon="el-icon-view"
            >
              查看详情
            </el-button>
            <el-button 
              size="small" 
              @click="copyTemplate(key)"
              icon="el-icon-document-copy"
            >
              复制模板
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- JSON查看器 -->
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
import { Message } from 'element-ui';
import { jarvisTemplates, templateNames } from '@/config/jarvisTemplates';
import { useJsonViewer } from '@/composables/useJsonViewer';
import JsonViewerDialog from '@/components/common/JsonViewerDialog.vue';

export default {
  name: 'JarvisTemplates',
  components: {
    JsonViewerDialog
  },
  setup() {
    const jsonViewer = useJsonViewer();

    const templateDescriptions = {
      CreateArchives: '用于创建患者档案，包含患者基本信息、详细信息和医生科室信息',
      GetArchives: '用于查询患者档案信息',
      UpdateArchives: '用于更新患者档案信息'
    };

    const getTemplateDescription = (key) => {
      return templateDescriptions[key] || '暂无描述';
    };

    const viewTemplate = (key) => {
      const template = jarvisTemplates[key];
      const templateName = templateNames[key];
      jsonViewer.open(JSON.stringify(template, null, 2), templateName);
    };

    const copyTemplate = async (key) => {
      const template = jarvisTemplates[key];
      const templateStr = JSON.stringify(template, null, 2);
      
      try {
        await navigator.clipboard.writeText(templateStr);
        Message.success('模板已复制到剪贴板');
      } catch (error) {
        // fallback
        const textarea = document.createElement('textarea');
        textarea.value = templateStr;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          Message.success('模板已复制到剪贴板');
        } catch (err) {
          Message.error('复制失败');
        }
        document.body.removeChild(textarea);
      }
    };

    return {
      jarvisTemplates,
      templateNames,
      jsonViewer,
      getTemplateDescription,
      viewTemplate,
      copyTemplate
    };
  }
};
</script>

<style scoped>
.jarvis-templates {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
}

.template-card {
  margin-bottom: 20px;
  height: 100%;
}

.card-header {
  text-align: center;
}

.template-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.template-info {
  margin-bottom: 15px;
}

.template-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.template-actions .el-button {
  flex: 1;
  margin: 0 5px;
}

.template-actions .el-button:first-child {
  margin-left: 0;
}

.template-actions .el-button:last-child {
  margin-right: 0;
}
</style>
