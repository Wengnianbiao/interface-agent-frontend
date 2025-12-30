<!-- src/App.vue -->
<template>
  <div id="app">
    <el-container style="height: 100vh;">
      <!-- 左侧导航栏 -->
      <el-aside :width="isCollapse ? '64px' : '200px'" style="height: 100%; transition: width 0.3s;">
        <NavHeader :is-collapse="isCollapse" @toggle-collapse="toggleCollapse" />
      </el-aside>
      
      <!-- 主要内容区域 -->
      <el-container style="flex-direction: column;">
        <!-- 面包屑导航栏 -->
        <el-header height="auto" style="padding: 0; line-height: 1;">
          <Breadcrumb />
        </el-header>
        
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import NavHeader from './components/Navbar.vue';
import PageBreadcrumb from './components/Breadcrumb.vue';

export default {
  name: 'App',
  components: {
    NavHeader,
    Breadcrumb: PageBreadcrumb
  },
  data() {
    return {
      isCollapse: false // 侧边栏是否折叠
    };
  },
  methods: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse;
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  overflow: hidden;
}

body {
  margin: 0;
  padding: 0;
}

/* 确保容器高度正确 */
.el-container {
  height: 100%;
}

/* 移除 el-header 默认样式 */
.el-header {
  padding: 0 !important;
  margin: 0;
  line-height: 1;
}

/* 主内容区域滚动 */
.el-main {
  overflow-y: auto;
  padding-top: 0;
}
</style>