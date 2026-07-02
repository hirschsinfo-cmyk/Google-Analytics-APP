<template>
  <div class="sku-wrapper">
    <!-- Card 1: Total SKUs -->
    <div class="sku-card">
      <h3>Total Available SKUs</h3>
      <p v-if="loading">Loading...</p>
      <p v-else-if="error">Error: {{ error }}</p>
      <p v-else>{{ totalSkus }}</p>
    </div>

    <!-- Card 2: Line Graph -->
    <div v-if="history.length" class="sku-card sku-graph">
      <h3>SKU Trend</h3>
      <canvas ref="chart"></canvas>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { Chart } from "chart.js/auto";

export default {
  name: "SkuCounter",
  data() {
    return {
      totalSkus: 0,
      history: [],
      loading: true,
      error: null,
      chart: null
    };
  },
  async mounted() {
    await this.fetchSkuCount();
    await this.fetchHistory();
    this.renderChart();
  },
  methods: {
    async fetchSkuCount() {
      try {
        const response = await axios.get(
          "https://conversions-api-0e62e1f06b26.herokuapp.com/magento/skus-live" // ✅ updated
        );
        this.totalSkus = response.data.totalSkus || 0;
      } catch (err) {
        this.error = err.message || "Failed to fetch SKU count";
      } finally {
        this.loading = false;
      }
    },
    async fetchHistory() {
      try {
        const response = await axios.get(
          "https://conversions-api-0e62e1f06b26.herokuapp.com/magento/sku-history"
        );
        this.history = response.data;
      } catch (err) {
        this.error = err.message || "Failed to fetch SKU history";
      }
    },
    renderChart() {
      if (!this.history.length) return;
      const ctx = this.$refs.chart.getContext("2d");
      this.chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: this.history.map(h => h.date),
          datasets: [
            {
              label: "Total SKUs",
              data: this.history.map(h => h.count),
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: "Date" } },
            y: { title: { display: true, text: "Count" }, beginAtZero: true }
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.sku-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center; /* centers both cards */
  gap: var(--space-6);
}

.sku-card {
  background: #fff;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  text-align: center;
  width: 100%;
  max-width: 400px; /* keeps it compact */
}

.sku-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}

.sku-card p {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary);
}

.sku-graph {
  max-width: 600px; /* slightly bigger for chart */
}

.sku-graph canvas {
  width: 100% !important;
  height: 300px !important; /* bigger chart area */
}
</style>