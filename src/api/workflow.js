import request from '@/utils/request'

/**
 * 获取工作流列表（分页）
 */
export function getWorkflows(params) {
  return request({
    url: '/v1/console/workflow/all',
    method: 'get',
    params
  })
}

/**
 * 删除工作流
 */
export function deleteWorkflow(flowId) {
  return request({
    url: `/v1/console/workflow/delete/${flowId}`,
    method: 'delete'
  })
}

/**
 * 创建工作流
 */
export function createWorkflow(data) {
  return request({
    url: '/v1/console/workflow/create',
    method: 'post',
    data
  })
}

/**
 * 更新工作流
 */
export function updateWorkflow(data) {
  return request({
    url: '/v1/console/workflow/update',
    method: 'post',
    data
  })
}

/**
 * 获取所有参数配置（用于导出）
 */
export function getNodeParamsUnpaged() {
  return request({
    url: '/v1/console/node-param/all-unpaged',
    method: 'get'
  })
}