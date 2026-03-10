<template>
  <div class="sku-section">
    <div class="section-header">
      <h2>📦 Basket Analysis</h2>
      <div v-if="enableComparison && hasComparisonData" class="comparison-badge">
        vs {{ formatDateRange(comparisonStartDate, comparisonEndDate) }}
      </div>
    </div>

    <div class="sku-metrics">
      <!-- Avg Items per Transaction -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">🛒</span>
          <span class="metric-label">Items per Transaction</span>
        </div>
        <div class="metric-value" :title="avgItemsPerTransaction.toFixed(3)">
          {{ avgItemsPerTransaction.toFixed(1) }}
        </div>
        <div v-if="enableComparison && hasComparisonData" class="metric-comparison">
          <div class="comparison-row">
            <span class="comparison-label">Comparison</span>
            <span class="comparison-value">{{ prevAvgItemsPerTransaction.toFixed(1) }}</span>
          </div>
          <div class="delta-badge" :class="getDeltaClass(itemsPerTransactionDelta)">
            <span class="material-symbols-outlined">
              {{ itemsPerTransactionDelta > 0 ? 'trending_up' : itemsPerTransactionDelta < 0 ? 'trending_down' : 'trending_flat' }}
            </span>
            {{ formatDelta(itemsPerTransactionDelta) }}
          </div>
        </div>
      </div>

      <!-- Avg Basket Value -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">💰</span>
          <span class="metric-label">Avg Basket Value</span>
        </div>
        <div class="metric-value" :title="'R ' + avgBasketSize.toFixed(2)">
          {{ formatZAR(avgBasketSize) }}
        </div>
        <div v-if="enableComparison && hasComparisonData" class="metric-comparison">
          <div class="comparison-row">
            <span class="comparison-label">Comparison</span>
            <span class="comparison-value">{{ formatZAR(prevAvgBasketSize) }}</span>
          </div>
          <div class="delta-badge" :class="getDeltaClass(basketSizeDelta)">
            <span class="material-symbols-outlined">
              {{ basketSizeDelta > 0 ? 'trending_up' : basketSizeDelta < 0 ? 'trending_down' : 'trending_flat' }}
            </span>
            {{ formatDelta(basketSizeDelta) }}
          </div>
        </div>
      </div>

      <!-- Total Items Sold -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">📊</span>
          <span class="metric-label">Total Items Sold</span>
        </div>
        <div class="metric-value" :title="totalItems.toString()">
          {{ formatNumber(totalItems) }}
        </div>
        <div v-if="enableComparison && hasComparisonData" class="metric-comparison">
          <div class="comparison-row">
            <span class="comparison-label">Comparison</span>
            <span class="comparison-value">{{ formatNumber(prevTotalItems) }}</span>
          </div>
          <div class="delta-badge" :class="getDeltaClass(totalItemsDelta)">
            <span class="material-symbols-outlined">
              {{ totalItemsDelta > 0 ? 'trending_up' : totalItemsDelta < 0 ? 'trending_down' : 'trending_flat' }}
            </span>
            {{ formatDelta(totalItemsDelta) }}
          </div>
        </div>
      </div>

      <!-- Total Revenue -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">💵</span>
          <span class="metric-label">Total Revenue</span>
        </div>
        <div class="metric-value" :title="'R ' + totalRevenue.toFixed(2)">
          {{ formatZAR(totalRevenue) }}
        </div>
        <div v-if="enableComparison && hasComparisonData" class="metric-comparison">
          <div class="comparison-row">
            <span class="comparison-label">Comparison</span>
            <span class="comparison-value">{{ formatZAR(prevTotalRevenue) }}</span>
          </div>
          <div class="delta-badge" :class="getDeltaClass(totalRevenueDelta)">
            <span class="material-symbols-outlined">
              {{ totalRevenueDelta > 0 ? 'trending_up' : totalRevenueDelta < 0 ? 'trending_down' : 'trending_flat' }}
            </span>
            {{ formatDelta(totalRevenueDelta) }}
          </div>
        </div>
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
    },
    basketComparison: {
      type: Array,
      default: () => []
    },
    enableComparison: {
      type: Boolean,
      default: false
    },
    comparisonStartDate: {
      type: String,
      default: ''
    },
    comparisonEndDate: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    // ==================== HELPER FUNCTIONS ====================

  console.log('🔍 SKUAnalysis props:', {
    basketDataLength: props.basketData?.length,
    basketComparisonLength: props.basketComparison?.length,
    enableComparison: props.enableComparison,
    comparisonStartDate: props.comparisonStartDate,
    comparisonEndDate: props.comparisonEndDate
  })

  if (props.basketComparison?.length > 0) {
    console.log('🔍 First comparison item:', props.basketComparison[0])
    console.log('🔍 Total comparison items:', props.basketComparison.reduce((sum, item) => sum + (item.itemsPurchased || 0), 0))
    console.log('🔍 Total comparison revenue:', props.basketComparison.reduce((sum, item) => sum + (item.purchaseRevenue || 0), 0))
  }


    const calculateDelta = (current, previous) => {
      if (previous == null || previous === 0 || current == null) return null
      return ((current - previous) / previous) * 100
    }

    const formatNumber = (value) => {
      if (value == null || isNaN(value)) return '0'
      return new Intl.NumberFormat('en-ZA').format(value)
    }

    const formatZAR = (value) => {
      if (value == null || isNaN(value)) return 'R0'
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    }

    const formatDelta = (delta) => {
      if (delta == null || isNaN(delta)) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Math.abs(delta).toFixed(1)}%`
    }

    const formatDateRange = (start, end) => {
      if (!start || !end) return ''
      const startDate = new Date(start).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
      const endDate = new Date(end).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
      return `${startDate} – ${endDate}`
    }

    const getDeltaClass = (delta) => {
      if (delta == null) return 'neutral'
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    }

    // ==================== CURRENT PERIOD CALCULATIONS ====================
    const totalItems = computed(() => {
      return props.basketData.reduce((sum, item) => sum + (item.itemsPurchased || 0), 0)
    })

    const totalTransactions = computed(() => {
      return props.basketData.reduce((sum, item) => sum + (item.transactions || 0), 0)
    })

    const totalRevenue = computed(() => {
      return props.basketData.reduce((sum, item) => sum + (item.purchaseRevenue || 0), 0)
    })

    const avgItemsPerTransaction = computed(() => {
      if (!totalTransactions.value) return 0
      return totalItems.value / totalTransactions.value
    })

    const avgBasketSize = computed(() => {
      if (!totalTransactions.value) return 0
      return totalRevenue.value / totalTransactions.value
    })

    // ==================== COMPARISON PERIOD CALCULATIONS ====================
    const hasComparisonData = computed(() => {
      return props.basketComparison && props.basketComparison.length > 0
    })

    const prevTotalItems = computed(() => {
      return props.basketComparison.reduce((sum, item) => sum + (item.itemsPurchased || 0), 0)
    })

    const prevTotalTransactions = computed(() => {
      return props.basketComparison.reduce((sum, item) => sum + (item.transactions || 0), 0)
    })

    const prevTotalRevenue = computed(() => {
      return props.basketComparison.reduce((sum, item) => sum + (item.purchaseRevenue || 0), 0)
    })

    const prevAvgItemsPerTransaction = computed(() => {
      if (!prevTotalTransactions.value) return 0
      return prevTotalItems.value / prevTotalTransactions.value
    })

    const prevAvgBasketSize = computed(() => {
      if (!prevTotalTransactions.value) return 0
      return prevTotalRevenue.value / prevTotalTransactions.value
    })

    // ==================== DELTAS ====================
    const itemsPerTransactionDelta = computed(() => {
      return calculateDelta(avgItemsPerTransaction.value, prevAvgItemsPerTransaction.value)
    })

    const basketSizeDelta = computed(() => {
      return calculateDelta(avgBasketSize.value, prevAvgBasketSize.value)
    })

    const totalItemsDelta = computed(() => {
      return calculateDelta(totalItems.value, prevTotalItems.value)
    })

    const totalRevenueDelta = computed(() => {
      return calculateDelta(totalRevenue.value, prevTotalRevenue.value)
    })

    return {
      // Current period
      totalItems,
      totalRevenue,
      avgItemsPerTransaction,
      avgBasketSize,
      
      // Comparison period
      hasComparisonData,
      prevTotalItems,
      prevTotalRevenue,
      prevAvgItemsPerTransaction,
      prevAvgBasketSize,
      
      // Deltas
      itemsPerTransactionDelta,
      basketSizeDelta,
      totalItemsDelta,
      totalRevenueDelta,
      
      // Helpers
      formatNumber,
      formatZAR,
      formatDelta,
      formatDateRange,
      getDeltaClass
    }
  }
}
</script>

<style scoped>
.sku-section {
  background: white;
  border-radius: 20px;
  padding: var(--space-6);
  margin-bottom: var(--space-8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f2f2f2;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
  gap: var(--space-2);
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
  letter-spacing: -0.01em;
}

.comparison-badge {
  font-size: 0.7rem;
  background: #f0f9ff;
  color: var(--primary);
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  border: 1px solid #bae6fd;
  font-weight: 500;
  white-space: nowrap;
}

.sku-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.metric-card {
  background: #f9fafc;
  border-radius: 18px;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border: 1px solid #edf2f7;
  transition: all 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.03);
  border-color: #e0e7ef;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.metric-icon {
  font-size: 1.1rem;
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.metric-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1.2;
  letter-spacing: -0.02em;
  cursor: help;
  border-bottom: 1px dotted transparent;
  transition: border-color 0.2s;
  margin-bottom: var(--space-1);
}

.metric-value:hover {
  border-bottom-color: var(--gray-300);
}

.metric-comparison {
  background: white;
  border-radius: 14px;
  padding: var(--space-2) var(--space-3);
  margin-top: var(--space-1);
  border: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.comparison-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.comparison-label {
  color: var(--gray-500);
  font-weight: 500;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.comparison-value {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 1rem;
}

.delta-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.75rem;
  white-space: nowrap;
  align-self: flex-start;
}

.delta-badge .material-symbols-outlined {
  font-size: 0.9rem;
}

.delta-badge.positive {
  background: #e6f7ec;
  color: #0b5e42;
}

.delta-badge.negative {
  background: #fee9e7;
  color: #b34033;
}

.delta-badge.neutral {
  background: #f0f0f0;
  color: #666666;
}

/* Responsive */
@media (max-width: 900px) {
  .sku-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .sku-metrics {
    grid-template-columns: 1fr;
  }
  
  .metric-value {
    font-size: 1.5rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>