import request from '@/utils/request'

/**
 * 获取节点参数配置列表（分页）
 */
export function getNodeParams(params) {
  return request({
    url: '/v1/console/node-param/all',
    method: 'get',
    params
  })
}

/**
 * 获取节点参数配置列表（无分页）
 */
export function getNodeParamsUnpaged(params) {
  return request({
    url: '/v1/console/node-param/all-unpaged',
    method: 'get',
    params
  })
}

/**
 * 创建节点参数配置
 */
export function createNodeParam(data) {
  return request({
    url: '/v1/console/node-param/create',
    method: 'post',
    data
  })
}

/**
 * 更新节点参数配置
 */
export function updateNodeParam(data) {
  return request({
    url: '/v1/console/node-param/update',
    method: 'post',
    data
  })
}

/**
 * 删除节点参数配置
 */
export function deleteNodeParam(configId) {
  return request({
    url: `/v1/console/node-param/${configId}`,
    method: 'delete'
  })
}

/**
 * 获取单个节点参数配置详情
 */
export function getNodeParamDetail(configId) {
  return request({
    url: `/v1/console/node-param/${configId}`,
    method: 'get'
  })
}