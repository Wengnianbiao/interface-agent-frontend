import { ref } from 'vue';
import { Message, MessageBox } from 'element-ui';
import request from '@/utils/request';
import { useFileOperation } from './useFileOperation';

/**
 * 节点导入导出逻辑
 * @param {Function} refreshCallback - 刷新列表的回调函数
 * @returns {Object} 导入导出相关的方法
 */
export function useNodeImportExport(refreshCallback) {
  const { selectFile, downloadJson } = useFileOperation();
  const loading = ref(false);

  /**
   * 导出节点配置
   */
  const exportNodeConfig = async (node) => {
    if (!node.nodeId) {
      Message.error('节点ID不存在，无法导出节点配置');
      return;
    }

    try {
      loading.value = true;
      const response = await request.get(`/v1/console/node/export-node/${node.nodeId}`);

      if (response.status !== 200 || response.data.code !== '200') {
        const errorMsg = response.data?.message || '导出接口响应异常';
        Message.error(`节点配置导出失败: ${errorMsg}`);
        return;
      }

      const exportData = response.data.rsp;
      if (!exportData) {
        Message.info('该节点没有配置数据');
        return;
      }

      downloadJson(exportData, `${node.nodeName}_节点配置_${new Date().getTime()}.json`);
      Message.success('节点配置导出成功');
    } catch (error) {
      const errorMsg = error?.message || '未知错误';
      Message.error(`节点配置导出失败: ${errorMsg}`);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 导出节点参数配置
   */
  const exportNodeParams = async (node) => {
    if (!node.nodeId) {
      Message.error('节点ID不存在，无法导出参数配置');
      return;
    }

    try {
      loading.value = true;
      const response = await request.get(`/v1/console/node/export/${node.nodeId}`);

      if (response.status !== 200 || response.data.code !== '200') {
        const errorMsg = response.data?.message || '导出接口响应异常';
        Message.error(`参数配置导出失败: ${errorMsg}`);
        return;
      }

      const exportData = response.data.rsp;
      if (!exportData) {
        Message.info('该节点没有参数配置数据');
        return;
      }

      downloadJson(exportData, `${node.nodeName}_参数配置_${new Date().getTime()}.json`);
      Message.success('参数配置导出成功');
    } catch (error) {
      const errorMsg = error?.message || '未知错误';
      Message.error(`参数配置导出失败: ${errorMsg}`);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 全局导入节点配置
   */
  const importGlobalNodeConfig = () => {
    selectFile(async (file) => {
      try {
        loading.value = true;
        const formData = new FormData();
        formData.append('file', file);

        const response = await request.post('/v1/console/node/import-node', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.status === 200 && response.data.code === '200') {
          Message.success('节点配置导入成功');
          if (refreshCallback) refreshCallback();
        } else {
          Message.error('节点配置导入失败: ' + (response.data.message || '未知错误'));
        }
      } catch (error) {
        Message.error('节点配置导入失败: ' + error.message);
      } finally {
        loading.value = false;
      }
    });
  };

  /**
   * 导入节点参数配置
   */
  const importNodeParams = (node) => {
    selectFile(async (file) => {
      try {
        loading.value = true;
        const formData = new FormData();
        formData.append('nodeId', node.nodeId);
        formData.append('file', file);

        const response = await request.post('/v1/console/node/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.status === 200 && response.data.code === '200') {
          Message.success('参数配置导入成功');
        } else {
          Message.error('参数配置导入失败: ' + (response.data.message || '未知错误'));
        }
      } catch (error) {
        Message.error('参数配置导入失败: ' + error.message);
      } finally {
        loading.value = false;
      }
    });
  };

  /**
   * 全量删除配置
   */
  const deleteAllConfig = async (node) => {
    try {
      await MessageBox.confirm(
        `确定要全量删除节点 "${node.nodeName}" 的所有配置吗? 此操作不可恢复!`, 
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'danger'
        }
      );

      await request.delete(`/v1/console/node/${node.nodeId}/delete-all-config`);
      Message.success('全量删除配置成功');
      if (refreshCallback) refreshCallback();
    } catch (error) {
      if (error !== 'cancel') {
        Message.error('全量删除配置失败: ' + (error.message || '未知错误'));
      }
    }
  };

  return {
    loading,
    exportNodeConfig,
    exportNodeParams,
    importGlobalNodeConfig,
    importNodeParams,
    deleteAllConfig
  };
}
