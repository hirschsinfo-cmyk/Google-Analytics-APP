<template>
  <div class="sku-section">
    <div class="section-header">
      <h2>📦 Basket Analysis</h2>
    </div>

    <div class="sku-metrics">
      <div class="metric-card">
        <span>Avg Items per Transaction</span>
        <span class="value">{{ avgItemsPerTransaction.toFixed(1) }}</span>
      </div>
      <div class="metric-card">
        <span>Avg Basket Size</span>
        <span class="value">{{ avgBasketSize.toFixed(1) }} items</span>
      </div>
      <div class="metric-card">
        <span>Total Items Sold</span>
        <span class="value">{{ formatNumber(totalItems) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'SKUAnalysis',
  props: {
    basketData: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const totalItems = computed(() => {
      return props.basketData.reduce((sum, item) => sum + (item.itemsPurchased || 0), 0)
    })

    const totalTransactions = computed(() => {
      return props.basketData.reduce((sum, item) => sum + (item.transactions || 0), 0)
    })

    const avgItemsPerTransaction = computed(() => {
      if (!totalTransactions.value) return 0
      return totalItems.value / totalTransactions.value
    })

    const avgBasketSize = computed(() => {
      if (!props.basketData.length) return 0
      return props.basketData.reduce((sum, item) => sum + (item.avgBasketSize || 0), 0) / props.basketData.length
    })

    const formatNumber = (value) => {
      return new Intl.NumberFormat('en-ZA').format(value)
    }

    return {
      totalItems,
      avgItemsPerTransaction,
      avgBasketSize,
      formatNumber
    }
  }
}
</script>

<style scoped>
.sku-section {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-md);
}

.section-header {
  margin-bottom: var(--space-4);
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.sku-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.metric-card {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.metric-card span:first-child {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.metric-card .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
}

@media (max-width: 768px) {
  .sku-metrics {
    grid-template-columns: 1fr;
  }
}
</style>