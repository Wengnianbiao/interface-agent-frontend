import { ref } from 'vue';

/**
 * 表格加载状态管理
 * @returns {Object} 加载状态相关的方法
 */
export function useTableLoading() {
  const loading = ref(false);

  const withLoading = async (fn) => {
    loading.value = true;
    try {
      return await fn();
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    withLoading
  };
}
