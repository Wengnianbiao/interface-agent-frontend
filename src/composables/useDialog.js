import { ref } from 'vue';

/**
 * 通用对话框逻辑
 * @returns {Object} 对话框相关的状态和方法
 */
export function useDialog() {
  const visible = ref(false);
  const title = ref('');

  const open = (dialogTitle = '') => {
    title.value = dialogTitle;
    visible.value = true;
  };

  const close = () => {
    visible.value = false;
  };

  return {
    visible,
    title,
    open,
    close
  };
}
