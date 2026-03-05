<template>
  <div class="promo-analysis-section">
    <div class="section-header">
      <h2>📢 Promo Period Analysis</h2>
    </div>

    <div class="promo-insights">
      <div class="insight" v-if="sourceData.length">
        <span>Paid Traffic:</span>
        <span>{{ paidTrafficPercentage }}%</span>
      </div>
      
      <div class="insight">
        <span>Conversion Rate:</span>
        <span>{{ avgConversionRate.toFixed(1) }}%</span>
      </div>
      
      <div class="insight">
        <span>Avg Basket Size:</span>
        <span>{{ avgBasketSize.toFixed(1) }} items</span>
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
    sessionData: {
      type: Array,
      required: true
    },
    basketData: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const paidTrafficPercentage = computed(() => {
      const paidSessions = props.sourceData
        .filter(item => item.channel?.toLowerCase().includes('paid'))
        .reduce((sum, item) => sum + (item.sessions || 0), 0)
      
      const totalSessions = props.sourceData.reduce((sum, item) => sum + (item.sessions || 0), 0)
      
      if (!totalSessions) return '0'
      return ((paidSessions / totalSessions) * 100).toFixed(1)
    })

    const avgConversionRate = computed(() => {
      if (!props.sessionData.length) return 0
      return props.sessionData.reduce((sum, item) => sum + (item.sessionConversionRate || 0), 0) / props.sessionData.length
    })

    const avgBasketSize = computed(() => {
      if (!props.basketData.length) return 0
      return props.basketData.reduce((sum, item) => sum + (item.avgBasketSize || 0), 0) / props.basketData.length
    })

    return {
      paidTrafficPercentage,
      avgConversionRate,
      avgBasketSize
    }
  }
}
</script>

<style scoped>
.promo-analysis-section {
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

.promo-insights {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.insight {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  font-size: 0.9rem;
}

.insight span:first-child {
  color: var(--gray-600);
}

.insight span:last-child {
  font-weight: 600;
  color: var(--gray-800);
}
</style>