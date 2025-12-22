import { Message } from 'element-ui';

/**
 * 文件导入导出操作
 * @returns {Object} 文件操作相关的方法
 */
export function useFileOperation() {
  
  /**
   * 触发文件选择
   * @param {Function} callback - 文件选择后的回调
   * @param {string} accept - 接受的文件类型
   */
  const selectFile = (callback, accept = '.json') => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = accept;
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        callback(e.target.files[0]);
      }
    };
    fileInput.click();
  };

  /**
   * 下载JSON文件
   * @param {Object|Array} data - 要下载的数据
   * @param {string} filename - 文件名
   */
  const downloadJson = (data, filename) => {
    if (!data) {
      Message.info('没有数据可导出');
      return;
    }

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json; charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * 读取JSON文件
   * @param {File} file - 文件对象
   * @returns {Promise<Object>} 解析后的JSON对象
   */
  const readJsonFile = (file) => {
    return new Promise((resolve, reject) => {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        reject(new Error('请上传JSON格式的文件'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('文件格式错误，无法解析'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  };

  return {
    selectFile,
    downloadJson,
    readJsonFile
  };
}
