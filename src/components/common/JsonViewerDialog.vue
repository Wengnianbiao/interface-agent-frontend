<template>
  <el-dialog
    :title="title"
    :visible="visible"
    width="80%"
    top="20px"
    @close="handleClose"
  >
    <div class="json-detail-container">
      <!-- XML 内容展示 -->
      <div v-if="isXml">
        <pre class="xml-preview">{{ rawContent }}</pre>
      </div>
      <!-- JSON 内容展示 -->
      <div v-else>
        <json-viewer 
          :value="parsedJson" 
          :expand-depth="3" 
          :copyable="false"
          :sort="false"
          class="left-aligned-json"
        />
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCopy">复制内容</el-button>
      <el-button type="primary" @click="handleClose">关闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import JsonViewer from 'vue-json-viewer';

export default {
  name: 'JsonViewerDialog',
  components: {
    JsonViewer
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'JSON详情'
    },
    rawContent: {
      type: String,
      default: ''
    },
    parsedJson: {
      type: [Object, Array],
      default: null
    },
    isXml: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        if (!val) {
          this.$emit('close');
        }
      }
    }
  },
  methods: {
    handleClose() {
      this.$emit('close');
    },
    handleCopy() {
      this.$emit('copy');
    }
  }
};
</script>

<style scoped>
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
</style>
