<template>
  <div class="basket-section" v-if="basketSizeData.length">
    <div class="section-header">
      <h2>Basket Analysis</h2>
    </div>

    <div class="basket-grid">
      <div 
        v-for="item in basketSizeData.slice(0, 5)" 
        :key="item.country" 
        class="basket-card"
      >
        <div class="basket-country">{{ item.country || 'Global' }}</div>

        <div class="basket-metrics">
          <div 
            v-for="metric in metrics" 
            :key="metric.key" 
            class="basket-metric"
          >
            <span class="metric-label">{{ metric.label }}</span>
            <span class="metric-value">{{ metric.format(item[metric.key]) }}</span>

            <!-- Secondary Period Change -->
            <span 
              v-if="enableComparison && item[metric.deltaKey] !== undefined" 
              class="metric-delta" 
              :class="getDeltaClass(item[metric.deltaKey])"
            >
              {{ formatDelta(item[metric.deltaKey]) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BasketAnalysis',
  props: {
    basketSizeData: { type: Array, required: true },
    enableComparison: { type: Boolean, default: false }
  },
  setup() {
    // --- Formatting helpers ---
    const formatZAR = (value) =>
      value && !isNaN(value)
        ? new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(value)
        : 'R0.00'

    const formatNumber = (value) =>
      value && !isNaN(value)
        ? new Intl.NumberFormat('en-ZA', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value)
        : '0'

    const formatAvgBasket = (value) =>
      value && !isNaN(value) ? `${value.toFixed(1)} items` : '0.0 items'

    const formatDelta = (delta) => {
      if (delta === null || delta === undefined || isNaN(delta)) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Math.abs(delta).toFixed(1)}%`
    }

    const getDeltaClass = (delta) => {
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    }

    // --- Metrics config ---
    const metrics = [
      { key: 'purchaseRevenue', label: 'Revenue', deltaKey: 'revenueDelta', format: formatZAR },
      { key: 'transactions', label: 'Transactions', deltaKey: 'transactionsDelta', format: formatNumber },
      { key: 'itemsPurchased', label: 'Items', deltaKey: 'itemsDelta', format: formatNumber },
      { key: 'avgBasketSize', label: 'Avg Basket', deltaKey: 'avgBasketSizeDelta', format: formatAvgBasket },
      { key: 'avgRevenuePerTransaction', label: 'Avg Order', deltaKey: 'aovDelta', format: formatZAR }
    ]

    return { formatDelta, getDeltaClass, metrics }
  }
}
</script>

<style scoped>
.basket-section {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.basket-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.basket-card {
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.basket-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.basket-country {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--gray-200);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1rem;
}

.basket-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.basket-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-1) 0;
}

.metric-label {
  font-size: 0.8rem;
  color: var(--gray-500);
  white-space: nowrap;
  font-weight: 500;
  min-width: 80px;
}

.metric-value {
  font-weight: 600;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
  flex: 1;
  font-size: 0.9rem;
}

.metric-delta {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-sm);
  min-width: 55px;
  text-align: center;
  white-space: nowrap;
}

.metric-delta.positive { background: #d1fae5; color: #065f46; }
.metric-delta.negative { background: #fee2e2; color: #991b1b; }
.metric-delta.neutral { background: var(--gray-100); color: var(--gray-600); }

@media (max-width: 768px) {
  .basket-grid {
    grid-template-columns: 1fr;
  }
  .basket-metric {
    flex-wrap: wrap;
  }
  .metric-value {
    max-width: none;
  }
}
</style>