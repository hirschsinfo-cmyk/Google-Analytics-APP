<template>
  <div id="app">
    <Dashboard />
  </div>
</template>

<script>
import Dashboard from './components/Dashboard.vue'

export default {
  name: 'App',
  components: {
    Dashboard
  }
}
</script>

<style>
/* Global styles if needed */
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
}
</style>