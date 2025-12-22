<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard">
    <h1>系统仪表板</h1>
    <LatestInvokeTime />
  </div>
</template>

<script>
import LatestInvokeTime from '@/components/InvokeTimeBoard.vue';

export default {
  name: 'SystemDashboard',
  components: {
    LatestInvokeTime
  }
};
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.dashboard h1 {
  color: #333;
  margin-bottom: 20px;
}
</style>