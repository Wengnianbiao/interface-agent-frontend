// router/index.js
import Vue from 'vue';
import VueRouter from 'vue-router';
import WorkFlowList from '@/components/Workflow.vue';
import WorkflowNode from '@/components/WorkflowNode.vue';
import InvokeLog from '@/components/InvokeLog.vue'; // 新增导入

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'SystemDashboard', 
    component: () => import('@/components/Dashboard.vue')
  },
  {
    path: '/workflow',
    name: 'Workflow',
    component: WorkFlowList
  },
  {
    path: '/workflow/nodes',
    name: 'WorkflowNode',
    component: WorkflowNode
  },
  {
    path: '/workflow/node/param/config',
    name: 'NodeParamConfig',
    component: () => import('@/components/NodeParamConfig.vue')
  },
  {
    path: '/invoke/log', // 新增路由
    name: 'InvokeLog',
    component: InvokeLog
  }
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
});

export default router;