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
 * 获取所有工作流（无分页）
 */
export function getAllWorkflowsUnpaged() {
  return request({
    url: '/v1/console/workflow/all-unpaged',
    method: 'get'
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
 * 获取所有接口节点（无分页）
 */
export function getAllNodes() {
  return request({
    url: '/v1/console/node/all-unpaged',
    method: 'get'
  })
}