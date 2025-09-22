<!-- src/components/Navbar.vue -->
<template>
  <div class="navbar">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-vertical-demo"
      mode="vertical"
      @select="handleSelect"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      style="height: 100%; overflow-y: auto;"
    >
      <el-menu-item index="1">
        <i class="el-icon-house"></i>
        <span slot="title">首页</span>
      </el-menu-item>
      <el-submenu index="2">
        <template slot="title">
          <i class="el-icon-document"></i>
          <span>工作流管理</span>
        </template>
        <el-menu-item index="2-1">工作流管理</el-menu-item>
        <el-menu-item index="2-2">接口管理</el-menu-item>
        <el-menu-item index="2-3">接口参数配置管理</el-menu-item>
        <el-menu-item index="2-4">接口调用日志</el-menu-item>
      </el-submenu>
      <el-menu-item index="3">
        <i class="el-icon-setting"></i>
        <span slot="title">系统设置</span>
      </el-menu-item>
      <el-submenu index="4">
        <template slot="title">
          <i class="el-icon-user"></i>
          <span>用户中心</span>
        </template>
        <el-menu-item index="4-1">个人信息</el-menu-item>
        <el-menu-item index="4-2">修改密码</el-menu-item>
        <el-menu-item index="4-3">退出登录</el-menu-item>
      </el-submenu>
    </el-menu>
  </div>
</template>

<script>
export default {
  name: 'NavHeader',
  data() {
    return {
      activeIndex: '1'
    };
  },
  methods: {
    handleSelect(key) {
      const currentPath = this.$route.path;
      switch (key) {
        case '1':
          if (currentPath !== '/') {
            this.$router.push('/');
          }
          break;
        case '2-1':
          if (currentPath !== '/workflow') {
            this.$router.push('/workflow');
          }
          break;
        case '2-2':
          if (currentPath !== '/workflow/nodes') {
            this.$router.push('/workflow/nodes');
          }
          break;
        case '2-3':
          if (currentPath !== '/workflow/node/param/config') {
            this.$router.push('/workflow/node/param/config');
          }
          break;
        case '2-4':
          if (currentPath !== '/invoke/log') {
            this.$router.push('/invoke/log');
          }
          break;
        case '3':
          if (currentPath !== '/settings') {
            this.$router.push('/settings');
          }
          break;
        case '4-3':
          console.log('退出登录');
          break;
        default:
          console.log('未知菜单项');
      }
    }
  },
  mounted() {
    const currentPath = this.$route.path;
    if (currentPath === '/') {
      this.activeIndex = '1';
    } else if (currentPath === '/workflow') {
      this.activeIndex = '2-1';
    } else if (currentPath === '/workflow/nodes') {
      this.activeIndex = '2-2';
    } else if (currentPath === '/workflow/node/param/config') {
      this.activeIndex = '2-3';
    } else if (currentPath === '/invoke/log') { // 新增判断
      this.activeIndex = '2-4';
    }
  },
  watch: {
    '$route'(to) {
      if (to.path === '/') {
        this.activeIndex = '1';
      } else if (to.path === '/workflow') {
        this.activeIndex = '2-1';
      } else if (to.path === '/workflow/nodes') {
        this.activeIndex = '2-2';
      } else if (to.path === '/workflow/node/param/config') {
        this.activeIndex = '2-3';
      } else if (to.path === '/invoke/log') { // 新增监听
        this.activeIndex = '2-4';
      }
    }
  }
};
</script>

<style scoped>
.navbar {
  height: 100vh; /* 设置为视口高度 */
  width: 200px;
  position: fixed; /* 固定定位 */
  top: 0;
  left: 0;
  z-index: 1000; /* 确保在其他元素之上 */
}

/* 调整菜单项的样式 */
.el-menu {
  border-right: none;
  height: 100%;
}

.el-menu-item,
.el-submenu {
  margin: 0;
  padding: 0;
}

.el-menu-item.is-active {
  background-color: #409eff !important;
}

/* 调整图标和文字的间距 */
.el-menu-item i,
.el-submenu i {
  margin-right: 10px;
}

/* 调整子菜单的样式 */
.el-submenu .el-menu {
  background-color: #545c64;
}
</style>