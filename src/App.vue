<!-- src/App.vue -->
<template>
  <div id="app">
    <el-container style="height: 100vh;">
      <!-- 左侧导航栏 -->
      <el-aside width="200px" style="height: 100%;">
        <NavHeader />
      </el-aside>
      
      <!-- 主要内容区域 -->
      <el-container>
        <!-- <el-header>
          <h1 style="margin: 0; color: #333;">可配置接口后台</h1>
        </el-header> -->
        
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import NavHeader from './components/Navbar.vue'; 

export default {
  name: 'App',
  components: {
    NavHeader
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0;
  height: 100%;
}

/* 为工作流组件添加顶部边距，避免被导航栏遮挡 */
.workflow-list {
  margin-top: 60px;
}

/* 确保容器高度正确 */
.el-container {
  height: 100%;
}
</style>