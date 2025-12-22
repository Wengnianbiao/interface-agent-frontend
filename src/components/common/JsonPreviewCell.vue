<template>
  <div class="json-preview-cell" @click="handleClick">
    <pre class="json-content">{{ formattedContent }}</pre>
    <div class="json-overlay">点击查看详情</div>
  </div>
</template>

<script>
export default {
  name: 'JsonPreviewCell',
  props: {
    content: {
      type: String,
      default: ''
    },
    maxLines: {
      type: Number,
      default: 3
    }
  },
  computed: {
    formattedContent() {
      if (!this.content) return '无数据';

      const isXml = this.content.trim().startsWith('<') && this.content.trim().endsWith('>');
      if (isXml) {
        return this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content;
      }

      try {
        const obj = JSON.parse(this.content);
        const formatted = JSON.stringify(obj, null, 2);
        const lines = formatted.split('\n');
        if (lines.length > this.maxLines) {
          return [...lines.slice(0, this.maxLines), '  ...'].join('\n');
        }
        return formatted;
      } catch (e) {
        return this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content;
      }
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.content);
    }
  }
};
</script>

<style scoped>
.json-preview-cell {
  position: relative;
  cursor: pointer;
}

.json-content {
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

.json-preview-cell:hover .json-content {
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

.json-preview-cell:hover .json-overlay {
  opacity: 1;
}
</style>
