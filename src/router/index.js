// router/index.js
import Vue from 'vue';
import VueRouter from 'vue-router';
import WorkFlowList from '@/views/Workflow.vue';
import WorkflowNode from '@/views/WorkflowNode.vue';
import InvokeLog from '@/views/InvokeLog.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Dashboard', 
    component: () => import('@/views/Dashboard.vue')
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
    component: () => import('@/views/NodeParamConfig.vue')
  },
  {
    path: '/mock/config',
    name: 'MockConfig',
    component: () => import('@/views/MockConfig.vue')
  },
  {
    path: '/mock/log',
    name: 'MockInvoke',
    component: () => import('@/views/MockInvokeLog.vue')
  },
  {
    path: '/jarvis/templates',
    name: 'JarvisTemplates',
    component: () => import('@/views/JarvisTemplates.vue')
  },
  {
    path: '/invoke/log', 
    name: 'InvokeLog',
    component: InvokeLog
  },
  {
    path: '/node/extension',
    name: 'NodeExtensionConfig',
    component: () => import('@/views/NodeExtensionConfig.vue')
  }
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
});

export default router;