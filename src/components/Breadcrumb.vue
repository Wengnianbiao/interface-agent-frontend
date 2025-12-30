<!-- src/components/Breadcrumb.vue -->
<template>
  <div class="breadcrumb-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item 
        v-for="(item, index) in breadcrumbList" 
        :key="index"
        :to="item.path ? { path: item.path } : null"
      >
        <i v-if="item.icon" :class="item.icon" style="margin-right: 5px;"></i>
        {{ item.name }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script>
export default {
  name: 'PageBreadcrumb',
  data() {
    return {
      breadcrumbList: []
    };
  },
  watch: {
    $route() {
      this.getBreadcrumb();
    }
  },
  mounted() {
    this.getBreadcrumb();
  },
  methods: {
    getBreadcrumb() {
      // 始终包含首页（接口看板）
      this.breadcrumbList = [{
        name: '接口看板',
        path: '/dashboard',
        icon: 'el-icon-house'
      }];

      // 添加当前路由的面包屑
      if (this.$route.meta && this.$route.meta.breadcrumb) {
        const breadcrumb = this.$route.meta.breadcrumb;
        
        if (Array.isArray(breadcrumb)) {
          // 如果是数组，则添加所有层级
          this.breadcrumbList.push(...breadcrumb);
        } else if (typeof breadcrumb === 'object') {
          // 如果是对象，直接添加
          this.breadcrumbList.push(breadcrumb);
        }
      }
    }
  }
};
</script>

<style scoped>
.breadcrumb-container {
  padding: 8px 20px;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.el-breadcrumb {
  line-height: 30px;
}

.el-breadcrumb >>> .el-breadcrumb__item {
  font-size: 14px;
}

.el-breadcrumb >>> .el-breadcrumb__inner {
  color: #606266;
  font-weight: normal;
}

.el-breadcrumb >>> .el-breadcrumb__inner:hover {
  color: #409eff;
  cursor: pointer;
}

.el-breadcrumb >>> .el-breadcrumb__item:last-child .el-breadcrumb__inner {
  color: #303133;
  font-weight: 500;
  cursor: text;
}

.el-breadcrumb >>> .el-breadcrumb__item:last-child .el-breadcrumb__inner:hover {
  color: #303133;
}
</style>
