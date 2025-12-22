import request from '@/utils/request'

/**
 * 查看所有启用的节点扩展配置
 */
export function getEnabledConfigs() {
  return request({
    url: '/api/node-extension/enabled-configs',
    method: 'get'
  })
}

/**
 * 查看当前已加载的节点扩展（运行时）
 */
export function getLoadedExtensions() {
  return request({
    url: '/api/node-extension/loaded',
    method: 'get'
  })
}

/**
 * 新增节点扩展配置并注册
 */
export function registerExtension(data) {
  return request({
    url: '/api/node-extension/register',
    method: 'post',
    data
  })
}

/**
 * 更新节点扩展配置并热刷新
 */
export function updateExtension(data) {
  return request({
    url: '/api/node-extension/update',
    method: 'post',
    data
  })
}

/**
 * 刷新指定节点扩展
 */
export function refreshExtension(codeId) {
  return request({
    url: `/api/node-extension/refresh/${codeId}`,
    method: 'post'
  })
}

/**
 * 禁用并卸载节点扩展
 */
export function disableExtension(codeId) {
  return request({
    url: `/api/node-extension/disable/${codeId}`,
    method: 'post'
  })
}
