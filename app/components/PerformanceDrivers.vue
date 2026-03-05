<template>
  <div class="drivers-section">
    <div class="section-header">
      <h2>📊 Performance Drivers</h2>
    </div>

    <div class="drivers-grid">
      <!-- Traffic -->
      <div class="driver-card">
        <div class="driver-header">
          <span class="driver-name">Traffic</span>
          <span class="driver-value">{{ formatNumber(totalSessions) }}</span>
        </div>
        <div class="driver-delta" :class="getDeltaClass(sessionsDelta)">
          {{ formatDelta(sessionsDelta) }} vs previous
        </div>
      </div>

      <!-- Conversion Rate -->
      <div class="driver-card">
        <div class="driver-header">
          <span class="driver-name">Conversion Rate</span>
          <span class="driver-value">{{ avgConversionRate.toFixed(1) }}%</span>
        </div>
        <div class="driver-delta" :class="getDeltaClass(conversionRateDelta)">
          {{ formatDelta(conversionRateDelta) }} vs previous
        </div>
      </div>

      <!-- Basket Size -->
      <div class="driver-card">
        <div class="driver-header">
          <span class="driver-name">Avg Basket Size</span>
          <span class="driver-value">{{ avgBasketSize.toFixed(1) }} items</span>
        </div>
        <div class="driver-delta" :class="getDeltaClass(basketSizeDelta)">
          {{ formatDelta(basketSizeDelta) }} vs previous
        </div>
      </div>

      <!-- Customer Type -->
      <div class="driver-card">
        <div class="driver-header">
          <span class="driver-name">New vs Returning</span>
          <span class="driver-value">
            {{ newCustomerPercent.toFixed(1) }}% / {{ returningCustomerPercent.toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'PerformanceDrivers',
  props: {
    sessionData: { type: Array, required: true },
    sessionComparison: { type: Array, default: () => [] },
    basketData: { type: Array, required: true },
    basketComparison: { type: Array, default: () => [] },
    engagementData: { type: Array, required: true }
  },
  setup(props) {
    // --- Sessions ---
    const totalSessions = computed(() =>
      props.sessionData.reduce((sum, item) => sum + (item.sessions || 0), 0)
    )
    const prevSessions = computed(() =>
      props.sessionComparison.reduce((sum, item) => sum + (item.sessions || 0), 0)
    )
    const sessionsDelta = computed(() =>
      calculateDelta(totalSessions.value, prevSessions.value)
    )

    // --- Conversion Rate ---
    const avgConversionRate = computed(() => {
      if (!props.sessionData.length) return 0
      return (
        props.sessionData.reduce((sum, item) => sum + (item.sessionConversionRate || 0), 0) /
        props.sessionData.length
      )
    })
    const prevConversionRate = computed(() => {
      if (!props.sessionComparison.length) return 0
      return (
        props.sessionComparison.reduce((sum, item) => sum + (item.sessionConversionRate || 0), 0) /
        props.sessionComparison.length
      )
    })
    const conversionRateDelta = computed(() =>
      calculateDelta(avgConversionRate.value, prevConversionRate.value)
    )

    // --- Basket Size ---
    const avgBasketSize = computed(() => {
      if (!props.basketData.length) return 0
      return (
        props.basketData.reduce((sum, item) => sum + (item.avgBasketSize || 0), 0) /
        props.basketData.length
      )
    })
    const prevBasketSize = computed(() => {
      if (!props.basketComparison.length) return 0
      return (
        props.basketComparison.reduce((sum, item) => sum + (item.avgBasketSize || 0), 0) /
        props.basketComparison.length
      )
    })
    const basketSizeDelta = computed(() =>
      calculateDelta(avgBasketSize.value, prevBasketSize.value)
    )

    // --- Customer Type ---
    const newUsers = computed(() =>
      props.engagementData.reduce((sum, item) => sum + (item.newUsers || 0), 0)
    )
    const activeUsers = computed(() =>
      props.engagementData.reduce((sum, item) => sum + (item.activeUsers || 0), 0)
    )
    const newCustomerPercent = computed(() => {
      if (!activeUsers.value) return 0
      return (newUsers.value / activeUsers.value) * 100
    })
    const returningCustomerPercent = computed(() => {
      if (!activeUsers.value) return 0
      const returning = activeUsers.value - newUsers.value
      return (returning / activeUsers.value) * 100
    })

    // --- Helpers ---
    const calculateDelta = (current, previous) => {
      if (!previous || previous === 0) return 0
      return ((current - previous) / previous) * 100
    }
    const formatNumber = (value) => new Intl.NumberFormat('en-ZA').format(value)
    const formatDelta = (delta) => {
      if (delta === 0) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Math.abs(delta).toFixed(1)}%`
    }
    const getDeltaClass = (delta) => {
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    }

    return {
      totalSessions,
      sessionsDelta,
      avgConversionRate,
      conversionRateDelta,
      avgBasketSize,
      basketSizeDelta,
      newCustomerPercent,
      returningCustomerPercent,
      formatNumber,
      formatDelta,
      getDeltaClass
    }
  }
}
</script>

<style scoped>
.drivers-section {
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

.drivers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.driver-card {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.driver-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.driver-name {
  font-weight: 500;
  color: var(--gray-600);
}

.driver-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
}

.driver-delta {
  font-size: 0.875rem;
  padding: 0.25rem 0;
  border-radius: var(--radius-sm);
}

.driver-delta.positive {
  color: #10b981;
}

.driver-delta.negative {
  color: #ef4444;
}

@media (max-width: 768px) {
  .drivers-grid {
    grid-template-columns: 1fr;
  }
}
</style>