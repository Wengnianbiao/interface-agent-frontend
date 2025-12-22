import { reactive, toRefs } from 'vue';

/**
 * 通用分页逻辑
 * @param {Object} options - 配置项
 * @param {number} options.pageSize - 初始每页数量，默认10
 * @param {Function} options.fetchData - 数据获取函数
 * @returns {Object} 分页相关的状态和方法
 */
export function usePagination(options = {}) {
  const { pageSize = 10, fetchData } = options;

  const state = reactive({
    pageNum: 1,
    pageSize,
    total: 0
  });

  const handleSizeChange = (val) => {
    state.pageSize = val;
    state.pageNum = 1;
    if (fetchData) fetchData();
  };

  const handleCurrentChange = (val) => {
    state.pageNum = val;
    if (fetchData) fetchData();
  };

  const reset = () => {
    state.pageNum = 1;
    state.total = 0;
  };

  return {
    ...toRefs(state),
    handleSizeChange,
    handleCurrentChange,
    reset
  };
}
