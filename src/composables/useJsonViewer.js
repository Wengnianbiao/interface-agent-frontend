import { ref, computed } from 'vue';
import { Message } from 'element-ui';

/**
 * JSON查看器逻辑
 * @returns {Object} JSON查看器相关的状态和方法
 */
export function useJsonViewer() {
  const visible = ref(false);
  const title = ref('');
  const rawContent = ref('');
  const parsedJson = ref(null);

  const isXml = computed(() => {
    const content = rawContent.value || '';
    return content.trim().startsWith('<') && content.trim().endsWith('>');
  });

  const open = (content, dialogTitle = 'JSON详情') => {
    title.value = dialogTitle;
    rawContent.value = content || '';
    
    if (!content) {
      parsedJson.value = null;
    } else if (isXml.value) {
      parsedJson.value = null;
    } else {
      try {
        parsedJson.value = JSON.parse(content);
      } catch (e) {
        parsedJson.value = { error: 'Invalid JSON format', content };
      }
    }
    
    visible.value = true;
  };

  const close = () => {
    visible.value = false;
    rawContent.value = '';
    parsedJson.value = null;
    title.value = '';
  };

  const copy = async () => {
    const text = rawContent.value || '';
    if (!text) {
      Message.warning('无内容可复制');
      return;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        Message.success('已复制到剪贴板');
      } else {
        fallbackCopy(text);
      }
    } catch (err) {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
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
      Message.success('已复制到剪贴板');
    } catch (err) {
      Message.error('复制失败，请手动复制');
    }

    document.body.removeChild(textarea);
  };

  const formatPreview = (str) => {
    if (!str) return '无数据';

    const isXmlContent = str.trim().startsWith('<') && str.trim().endsWith('>');
    if (isXmlContent) {
      return str.length > 100 ? str.substring(0, 100) + '...' : str;
    }

    try {
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
  };

  return {
    visible,
    title,
    rawContent,
    parsedJson,
    isXml,
    open,
    close,
    copy,
    formatPreview
  };
}
