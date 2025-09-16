import request from '@/utils/request'

/**
 * 获取工作流节点
 */
export function getNodeListUnpaged(params) {
  return request({
    url: '/v1/console/node/all-unpaged',
    method: 'get',
    params
  })
}