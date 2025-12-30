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
    redirect: '/invoke/log' // 默认跳转到接口调用日志
  },
  {
    path: '/dashboard',
    name: 'Dashboard', 
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      breadcrumb: [
        { name: '接口看板', path: '/dashboard', icon: 'el-icon-house' }
      ]
    }
  },
  {
    path: '/workflow',
    name: 'Workflow',
    component: WorkFlowList,
    meta: {
      breadcrumb: [
        { name: '工作流管理', path: null, icon: 'el-icon-document' },
        { name: '工作流列表', path: '/workflow' }
      ]
    }
  },
  {
    path: '/workflow/nodes',
    name: 'WorkflowNode',
    component: WorkflowNode,
    meta: {
      breadcrumb: [
        { name: '工作流管理', path: null, icon: 'el-icon-document' },
        { name: '工作流节点', path: '/workflow/nodes' }
      ]
    }
  },
  {
    path: '/workflow/node/param/config',
    name: 'NodeParamConfig',
    component: () => import('@/views/NodeParamConfig.vue'),
    meta: {
      breadcrumb: [
        { name: '工作流管理', path: null, icon: 'el-icon-document' },
        { name: '节点参数配置', path: '/workflow/node/param/config' }
      ]
    }
  },
  {
    path: '/workflow/node/schedule',
    name: 'NodeSchedule',
    component: () => import('@/views/NodeSchedule.vue'),
    meta: {
      breadcrumb: [
        { name: '工作流管理', path: null, icon: 'el-icon-document' },
        { name: '节点调度管理', path: '/workflow/node/schedule' }
      ]
    }
  },
  {
    path: '/workflow/node/param/guide',
    name: 'NodeParamGuide',
    component: () => import('@/views/NodeParamGuide.vue'),
    meta: {
      breadcrumb: [
        { name: '配置手册', path: null, icon: 'el-icon-reading' },
        { name: '参数配置教程', path: '/workflow/node/param/guide' }
      ]
    }
  },
  {
    path: '/mock/config',
    name: 'MockConfig',
    component: () => import('@/views/MockConfig.vue'),
    meta: {
      breadcrumb: [
        { name: 'Mock', path: null, icon: 'el-icon-set-up' },
        { name: 'Mock响应配置', path: '/mock/config' }
      ]
    }
  },
  {
    path: '/mock/log',
    name: 'MockInvoke',
    component: () => import('@/views/MockInvokeLog.vue'),
    meta: {
      breadcrumb: [
        { name: 'Mock', path: null, icon: 'el-icon-set-up' },
        { name: 'Mock调用测试', path: '/mock/log' }
      ]
    }
  },
  {
    path: '/jarvis/templates',
    name: 'JarvisTemplates',
    component: () => import('@/views/JarvisTemplates.vue'),
    meta: {
      breadcrumb: [
        { name: 'Mock', path: null, icon: 'el-icon-set-up' },
        { name: 'Jarvis入参模板', path: '/jarvis/templates' }
      ]
    }
  },
  {
    path: '/invoke/log', 
    name: 'InvokeLog',
    component: InvokeLog,
    meta: {
      breadcrumb: [
        { name: '接口调用日志', path: '/invoke/log', icon: 'el-icon-document-copy' }
      ]
    }
  },
  {
    path: '/node/extension',
    name: 'NodeExtensionConfig',
    component: () => import('@/views/NodeExtensionConfig.vue'),
    meta: {
      breadcrumb: [
        { name: 'SPI节点扩展', path: '/node/extension', icon: 'el-icon-cpu' }
      ]
    }
  }
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
});

export default router;