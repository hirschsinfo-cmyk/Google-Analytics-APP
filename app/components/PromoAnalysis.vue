<template>
  <div class="promo-section">
    <div class="section-header">
      <h2>📢 Promo Period Analysis</h2>
      <div v-if="enableComparison && hasComparisonData" class="comparison-badge">
        vs {{ formatDateRange(comparisonStartDate, comparisonEndDate) }}
      </div>
    </div>

    <div class="promo-metrics">
      <!-- Paid Traffic -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">🎯</span>
          <span class="metric-label">Paid Traffic</span>
        </div>
        <div class="metric-value" :title="paidTrafficValue + ' sessions'">
          {{ paidTrafficPercentage }}%
        </div>
        <div v-if="enableComparison && hasComparisonData" class="metric-comparison">
          <div class="comparison-row">
            <span class="comparison-label">Comparison</span>
            <span class="comparison-value">{{ prevPaidTrafficPercentage }}%</span>
          </div>
          <div class="delta-badge" :class="getDeltaClass(paidTrafficDelta)">
            <span class="material-symbols-outlined">
              {{ paidTrafficDelta > 0 ? 'trending_up' : paidTrafficDelta < 0 ? 'trending_down' : 'trending_flat' }}
            </span>
            {{ formatDelta(paidTrafficDelta) }}
          </div>
        </div>
      </div>

      <!-- Conversion Rate -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">📈</span>
          <span class="metric-label">Conversion Rate</span>
        </div>
        <div class="metric-value" :title="avgConversionRate.toFixed(3) + '%'">
          {{ avgConversionRate.toFixed(1) }}%
        </div>
        <div v-if="enableComparison && hasComparisonData" class="metric-comparison">
          <div class="comparison-row">
            <span class="comparison-label">Comparison</span>
            <span class="comparison-value">{{ prevConversionRate.toFixed(1) }}%</span>
          </div>
          <div class="delta-badge" :class="getDeltaClass(conversionRateDelta)">
            <span class="material-symbols-outlined">
              {{ conversionRateDelta > 0 ? 'trending_up' : conversionRateDelta < 0 ? 'trending_down' : 'trending_flat' }}
            </span>
            {{ formatDelta(conversionRateDelta) }}
          </div>
        </div>
      </div>

      <!-- Avg Basket Size -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">🛒</span>
          <span class="metric-label">Avg Basket Size</span>
        </div>
        <div class="metric-value" :title="avgBasketSize.toFixed(2) + ' items'">
          {{ avgBasketSize.toFixed(1) }} items
        </div>
        <div v-if="enableComparison && hasComparisonData" class="metric-comparison">
          <div class="comparison-row">
            <span class="comparison-label">Comparison</span>
            <span class="comparison-value">{{ prevBasketSize.toFixed(1) }} items</span>
          </div>
          <div class="delta-badge" :class="getDeltaClass(basketSizeDelta)">
            <span class="material-symbols-outlined">
              {{ basketSizeDelta > 0 ? 'trending_up' : basketSizeDelta < 0 ? 'trending_down' : 'trending_flat' }}
            </span>
            {{ formatDelta(basketSizeDelta) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'PromoAnalysis',
  props: {
    sourceData: {
      type: Array,
      required: true
    },
    sourceComparison: {
      type: Array,
      default: () => []
    },
    sessionData: {
      type: Array,
      required: true
    },
    sessionComparison: {
      type: Array,
      default: () => []
    },
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
    const calculateDelta = (current, previous) => {
      if (previous == null || previous === 0 || current == null) return null
      return ((current - previous) / previous) * 100
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

    // ==================== HAS COMPARISON DATA ====================
    const hasComparisonData = computed(() => {
      return props.sourceComparison?.length > 0 || 
             props.sessionComparison?.length > 0 || 
             props.basketComparison?.length > 0
    })

    // ==================== CURRENT PERIOD ====================
    // Paid Traffic
    const paidTrafficValue = computed(() => {
      return props.sourceData
        .filter(item => item.channel?.toLowerCase().includes('paid'))
        .reduce((sum, item) => sum + (item.sessions || 0), 0)
    })

    const totalSessions = computed(() => {
      return props.sourceData.reduce((sum, item) => sum + (item.sessions || 0), 0)
    })

    const paidTrafficPercentage = computed(() => {
      if (!totalSessions.value) return '0.0'
      return ((paidTrafficValue.value / totalSessions.value) * 100).toFixed(1)
    })

    // Conversion Rate (weighted)
    const totalConversions = computed(() => {
      return props.sessionData.reduce((sum, item) => sum + (item.conversions || 0), 0)
    })

    const totalSessionCount = computed(() => {
      return props.sessionData.reduce((sum, item) => sum + (item.sessions || 0), 0)
    })

    const avgConversionRate = computed(() => {
      if (!totalSessionCount.value) return 0
      return (totalConversions.value / totalSessionCount.value) * 100
    })

    // Basket Size (weighted)
    const totalItems = computed(() => {
      return props.basketData.reduce((sum, item) => sum + (item.itemsPurchased || 0), 0)
    })

    const totalTransactions = computed(() => {
      return props.basketData.reduce((sum, item) => sum + (item.transactions || 0), 0)
    })

    const avgBasketSize = computed(() => {
      if (!totalTransactions.value) return 0
      return totalItems.value / totalTransactions.value
    })

    // ==================== COMPARISON PERIOD ====================
    // Previous Paid Traffic
    const prevPaidTrafficValue = computed(() => {
      return props.sourceComparison
        .filter(item => item.channel?.toLowerCase().includes('paid'))
        .reduce((sum, item) => sum + (item.sessions || 0), 0)
    })

    const prevTotalSessions = computed(() => {
      return props.sourceComparison.reduce((sum, item) => sum + (item.sessions || 0), 0)
    })

    const prevPaidTrafficPercentage = computed(() => {
      if (!prevTotalSessions.value) return '0.0'
      return ((prevPaidTrafficValue.value / prevTotalSessions.value) * 100).toFixed(1)
    })

    // Previous Conversion Rate
    const prevTotalConversions = computed(() => {
      return props.sessionComparison.reduce((sum, item) => sum + (item.conversions || 0), 0)
    })

    const prevTotalSessionCount = computed(() => {
      return props.sessionComparison.reduce((sum, item) => sum + (item.sessions || 0), 0)
    })

    const prevConversionRate = computed(() => {
      if (!prevTotalSessionCount.value) return 0
      return (prevTotalConversions.value / prevTotalSessionCount.value) * 100
    })

    // Previous Basket Size
    const prevTotalItems = computed(() => {
      return props.basketComparison.reduce((sum, item) => sum + (item.itemsPurchased || 0), 0)
    })

    const prevTotalTransactions = computed(() => {
      return props.basketComparison.reduce((sum, item) => sum + (item.transactions || 0), 0)
    })

    const prevBasketSize = computed(() => {
      if (!prevTotalTransactions.value) return 0
      return prevTotalItems.value / prevTotalTransactions.value
    })

    // ==================== DELTAS ====================
    const paidTrafficDelta = computed(() => {
      const current = parseFloat(paidTrafficPercentage.value)
      const previous = parseFloat(prevPaidTrafficPercentage.value)
      return calculateDelta(current, previous)
    })

    const conversionRateDelta = computed(() => {
      return calculateDelta(avgConversionRate.value, prevConversionRate.value)
    })

    const basketSizeDelta = computed(() => {
      return calculateDelta(avgBasketSize.value, prevBasketSize.value)
    })

    return {
      // Current period
      paidTrafficPercentage,
      paidTrafficValue,
      avgConversionRate,
      avgBasketSize,
      
      // Comparison period
      hasComparisonData,
      prevPaidTrafficPercentage,
      prevConversionRate,
      prevBasketSize,
      
      // Deltas
      paidTrafficDelta,
      conversionRateDelta,
      basketSizeDelta,
      
      // Helpers
      formatDelta,
      formatDateRange,
      getDeltaClass
    }
  }
}
</script>

<style scoped>
.promo-section {
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

.promo-metrics {
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
  .promo-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .promo-metrics {
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