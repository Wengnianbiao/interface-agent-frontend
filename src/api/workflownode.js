import request from '@/utils/request'

/**
 * 获取工作流节点列表（分页）
 */
export function getNodeList(params) {
  return request({
    url: '/v1/console/node/all',
    method: 'get',
    params
  })
}

/**
 * 获取工作流节点列表（无分页）
 */
export function getNodeListUnpaged(params) {
  return request({
    url: '/v1/console/node/all-unpaged',
    method: 'get',
    params
  })
}

/**
 * 创建节点
 */
export function createNode(data) {
  return request({
    url: '/v1/console/node/create',
    method: 'post',
    data
  })
}

/**
 * 更新节点
 */
export function updateNode(data) {
  return request({
    url: '/v1/console/node/update',
    method: 'post',
    data
  })
}

/**
 * 删除节点
 */
export function deleteNode(nodeId) {
  return request({
    url: `/v1/console/node/${nodeId}`,
    method: 'delete'
  })
}