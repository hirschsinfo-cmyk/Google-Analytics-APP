<template>
  <div class="sku-counter">
    <h3>Total Available SKUs</h3>
    <p v-if="loading">Loading...</p>
    <p v-else-if="error">Error: {{ error }}</p>
    <p v-else>{{ totalSkus }}</p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "SkuCounter",
  data() {
    return {
      totalSkus: 0,
      loading: true,
      error: null
    };
  },
  mounted() {
    this.fetchSkuCount();
  },
  methods: {
    async fetchSkuCount() {
      try {
        // 🔹 Call your backend server endpoint
        const response = await axios.get("https://conversions-api-0e62e1f06b26.herokuapp.com/magento/skus");

        // Server returns { totalSkus: number }
        this.totalSkus = response.data.totalSkus || 0;
      } catch (err) {
        this.error = err.message || "Failed to fetch SKU count";
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.sku-counter {
  background: #fff;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-6); /* spacing from next component */
  text-align: center;
}
.sku-counter h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}
.sku-counter p {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary);
}
</style>