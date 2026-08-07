<template>
  <div class="drivers-section">
    <div class="section-header">
      <h2>📊 Performance Drivers</h2>
      <div v-if="enableComparison" class="comparison-badge">
        vs {{ comparisonStartDate }} to {{ comparisonEndDate }}
      </div>
    </div>

    <div class="drivers-grid">
      <!-- Traffic -->
      <div class="driver-card" :class="{ expanded: expandedCard === 'traffic' }">
        <div class="card-header" @click="toggleExpand('traffic')">
          <div class="driver-header">
            <span class="driver-name">Traffic</span>
            <span class="driver-value">{{ formatNumber(totalSessions) }}</span>
          </div>
          <button class="expand-btn" :aria-expanded="expandedCard === 'traffic'">
            <span class="material-symbols-outlined">
              {{ expandedCard === 'traffic' ? 'expand_less' : 'expand_more' }}
            </span>
          </button>
        </div>
        
        <div v-if="enableComparison && hasComparisonData" class="driver-delta" :class="getDeltaClass(sessionsDelta)">
          {{ formatDelta(sessionsDelta) }}
          <span class="comparison-value">({{ formatNumber(prevSessions) }})</span>
        </div>
        <div v-else-if="enableComparison && !hasComparisonData" class="driver-delta neutral">
          No comparison data
        </div>
        <div v-else class="driver-delta neutral">—</div>

        <!-- Expanded Details -->
        <div v-if="expandedCard === 'traffic'" class="expanded-details">
          <div class="detail-row">
            <span class="detail-label">Current Period Sessions:</span>
            <span class="detail-value">{{ formatNumber(totalSessions) }}</span>
          </div>
          <div v-if="enableComparison" class="detail-row">
            <span class="detail-label">Comparison Period Sessions:</span>
            <span class="detail-value">{{ hasComparisonData ? formatNumber(prevSessions) : 'No data' }}</span>
          </div>
          <div v-if="enableComparison && hasComparisonData" class="detail-row">
            <span class="detail-label">Absolute Change:</span>
            <span class="detail-value" :class="getDeltaClass(sessionsDelta)">
              {{ formatNumber(totalSessions - prevSessions) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Conversions:</span>
            <span class="detail-value">{{ formatNumber(totalConversions) }}</span>
          </div>
        </div>
      </div>

      <!-- Conversion Rate -->
      <div class="driver-card" :class="{ expanded: expandedCard === 'conversion' }">
        <div class="card-header" @click="toggleExpand('conversion')">
          <div class="driver-header">
            <span class="driver-name">Conversion Rate</span>
            <span class="driver-value">{{ avgConversionRate.toFixed(1) }}%</span>
          </div>
          <button class="expand-btn" :aria-expanded="expandedCard === 'conversion'">
            <span class="material-symbols-outlined">
              {{ expandedCard === 'conversion' ? 'expand_less' : 'expand_more' }}
            </span>
          </button>
        </div>
        
        <div v-if="enableComparison && hasComparisonData" class="driver-delta" :class="getDeltaClass(conversionRateDelta)">
          {{ formatDelta(conversionRateDelta) }}
          <span class="comparison-value">({{ prevConversionRate.toFixed(1) }}%)</span>
        </div>
        <div v-else-if="enableComparison && !hasComparisonData" class="driver-delta neutral">
          No comparison data
        </div>
        <div v-else class="driver-delta neutral">—</div>

        <!-- Expanded Details -->
        <div v-if="expandedCard === 'conversion'" class="expanded-details">
          <div class="detail-row">
            <span class="detail-label">Current Rate:</span>
            <span class="detail-value">{{ avgConversionRate.toFixed(2) }}%</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Conversions:</span>
            <span class="detail-value">{{ formatNumber(totalConversions) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Sessions:</span>
            <span class="detail-value">{{ formatNumber(totalSessions) }}</span>
          </div>
          <div v-if="enableComparison && hasComparisonData" class="detail-row">
            <span class="detail-label">Previous Rate:</span>
            <span class="detail-value">{{ prevConversionRate.toFixed(2) }}%</span>
          </div>
          <div v-if="enableComparison && hasComparisonData" class="detail-row">
            <span class="detail-label">Previous Conversions:</span>
            <span class="detail-value">{{ formatNumber(prevTotalConversions) }}</span>
          </div>
        </div>
      </div>

      <!-- Basket Size (Items per Transaction) -->
      <div class="driver-card" :class="{ expanded: expandedCard === 'basket' }">
        <div class="card-header" @click="toggleExpand('basket')">
          <div class="driver-header">
            <span class="driver-name">Avg Items per Transaction</span>
            <span class="driver-value">{{ avgItemsPerTransaction.toFixed(1) }}</span>
          </div>
          <button class="expand-btn" :aria-expanded="expandedCard === 'basket'">
            <span class="material-symbols-outlined">
              {{ expandedCard === 'basket' ? 'expand_less' : 'expand_more' }}
            </span>
          </button>
        </div>
        
        <div v-if="enableComparison && hasBasketComparison" class="driver-delta" :class="getDeltaClass(itemsPerTransactionDelta)">
          {{ formatDelta(itemsPerTransactionDelta) }}
          <span class="comparison-value">({{ prevItemsPerTransaction.toFixed(1) }})</span>
        </div>
        <div v-else-if="enableComparison && !hasBasketComparison" class="driver-delta neutral">
          No comparison data
        </div>
        <div v-else class="driver-delta neutral">—</div>

        <!-- Expanded Details -->
        <div v-if="expandedCard === 'basket'" class="expanded-details">
          <div class="detail-row">
            <span class="detail-label">Current Avg:</span>
            <span class="detail-value">{{ avgItemsPerTransaction.toFixed(2) }} items</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Items:</span>
            <span class="detail-value">{{ formatNumber(totalItems) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Transactions:</span>
            <span class="detail-value">{{ formatNumber(totalTransactions) }}</span>
          </div>
          <div v-if="enableComparison && hasBasketComparison" class="detail-row">
            <span class="detail-label">Previous Avg:</span>
            <span class="detail-value">{{ prevItemsPerTransaction.toFixed(2) }} items</span>
          </div>
          <div v-if="enableComparison && hasBasketComparison" class="detail-row">
            <span class="detail-label">Previous Items:</span>
            <span class="detail-value">{{ formatNumber(prevTotalItems) }}</span>
          </div>
          <div v-if="enableComparison && hasBasketComparison" class="detail-row">
            <span class="detail-label">Previous Transactions:</span>
            <span class="detail-value">{{ formatNumber(prevTotalTransactions) }}</span>
          </div>
          <div v-if="enableComparison && !hasBasketComparison" class="detail-row">
            <span class="detail-label">Comparison Period:</span>
            <span class="detail-value neutral">No transaction data available</span>
          </div>
        </div>
      </div>

      <!-- New vs Returning -->
      <div class="driver-card" :class="{ expanded: expandedCard === 'customers' }">
        <div class="card-header" @click="toggleExpand('customers')">
          <div class="driver-header">
            <span class="driver-name">New vs Returning</span>
            <span class="driver-value">
              {{ newCustomerPercent.toFixed(1) }}% / {{ returningCustomerPercent.toFixed(1) }}%
            </span>
          </div>
          <button class="expand-btn" :aria-expanded="expandedCard === 'customers'">
            <span class="material-symbols-outlined">
              {{ expandedCard === 'customers' ? 'expand_less' : 'expand_more' }}
            </span>
          </button>
        </div>
        
        <div v-if="enableComparison && hasCustomerComparison" class="driver-delta" :class="getDeltaClass(newUsersDelta)">
          New: {{ formatDelta(newUsersDelta) }}
        </div>
        <div v-else-if="enableComparison && !hasCustomerComparison" class="driver-delta neutral">
          No comparison data
        </div>
        <div v-else class="driver-delta neutral">—</div>

        <!-- Expanded Details -->
        <div v-if="expandedCard === 'customers'" class="expanded-details">
          <div class="detail-row">
            <span class="detail-label">New Customers:</span>
            <span class="detail-value">{{ formatNumber(newUsers) }} ({{ newCustomerPercent.toFixed(1) }}%)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Returning Customers:</span>
            <span class="detail-value">{{ formatNumber(returningUsers) }} ({{ returningCustomerPercent.toFixed(1) }}%)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Active Users:</span>
            <span class="detail-value">{{ formatNumber(activeUsers) }}</span>
          </div>
          <div v-if="enableComparison && hasCustomerComparison" class="detail-row">
            <span class="detail-label">Previous New:</span>
            <span class="detail-value">{{ formatNumber(prevNewUsers) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

export default {
  name: 'PerformanceDrivers',
  props: {
    sessionData: { type: Array, required: true },
    sessionComparison: { type: Array, default: () => [] },
    basketData: { type: Array, required: true },
    basketComparison: { type: Array, default: () => [] },
    engagementData: { type: Array, required: true },
    enableComparison: { type: Boolean, default: false },
    comparisonStartDate: { type: String, default: '' },
    comparisonEndDate: { type: String, default: '' }
  },
  emits: ['toggleExpand'],
  setup(props, { emit }) {
    const expandedCard = ref(null)

    // --- Helper Functions ---
    const calculateDelta = (current, previous) => {
      if (previous == null || previous === 0 || current == null) return null
      return ((current - previous) / previous) * 100
    }

    const formatNumber = (value) => {
      if (value == null || isNaN(value)) return '0'
      return new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(value)
    }

    const formatDelta = (delta) => {
      if (delta == null || isNaN(delta)) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Math.abs(delta).toFixed(1)}%`
    }

    const getDeltaClass = (delta) => {
      if (delta == null) return 'neutral'
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    }

    const toggleExpand = (card) => {
      expandedCard.value = expandedCard.value === card ? null : card
      emit('toggleExpand', expandedCard.value)
    }

    // Check if we have any comparison data
    const hasComparisonData = computed(() => 
      props.sessionComparison && props.sessionComparison.length > 0
    )

    const hasBasketComparison = computed(() => {
      if (!props.basketComparison || props.basketComparison.length === 0) return false
      // Check if there are any actual transactions in the comparison data
      return props.basketComparison.some(item => (item.transactions || 0) > 0)
    })

    const hasCustomerComparison = computed(() => 
      props.sessionComparison && props.sessionComparison.length > 0 &&
      props.sessionComparison.some(item => (item.newUsers || 0) > 0)
    )

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

    // --- Conversion Rate (weighted) ---
    const totalConversions = computed(() =>
      props.sessionData.reduce((sum, item) => sum + (item.conversions || 0), 0)
    )
    const avgConversionRate = computed(() => {
      if (!totalSessions.value) return 0
      return (totalConversions.value / totalSessions.value) * 100
    })

    const prevTotalConversions = computed(() =>
      props.sessionComparison.reduce((sum, item) => sum + (item.conversions || 0), 0)
    )
    const prevConversionRate = computed(() => {
      if (!prevSessions.value) return 0
      return (prevTotalConversions.value / prevSessions.value) * 100
    })
    const conversionRateDelta = computed(() =>
      calculateDelta(avgConversionRate.value, prevConversionRate.value)
    )

    // --- Basket Size (Items per Transaction) ---
    const totalTransactions = computed(() =>
      props.basketData.reduce((sum, item) => sum + (item.transactions || 0), 0)
    )
    const totalItems = computed(() =>
      props.basketData.reduce((sum, item) => sum + (item.itemsPurchased || 0), 0)
    )
    const avgItemsPerTransaction = computed(() => {
      if (!totalTransactions.value) return 0
      return totalItems.value / totalTransactions.value
    })

    const prevTotalTransactions = computed(() =>
      props.basketComparison.reduce((sum, item) => sum + (item.transactions || 0), 0)
    )
    const prevTotalItems = computed(() =>
      props.basketComparison.reduce((sum, item) => sum + (item.itemsPurchased || 0), 0)
    )
    const prevItemsPerTransaction = computed(() => {
      if (!prevTotalTransactions.value) return 0
      return prevTotalItems.value / prevTotalTransactions.value
    })
    const itemsPerTransactionDelta = computed(() =>
      calculateDelta(avgItemsPerTransaction.value, prevItemsPerTransaction.value)
    )

    // --- Customer Type ---
    const newUsers = computed(() =>
      props.engagementData.reduce((sum, item) => sum + (item.newUsers || 0), 0)
    )
    const activeUsers = computed(() =>
      props.engagementData.reduce((sum, item) => sum + (item.activeUsers || 0), 0)
    )
    const returningUsers = computed(() => activeUsers.value - newUsers.value)
    const newCustomerPercent = computed(() =>
      activeUsers.value ? (newUsers.value / activeUsers.value) * 100 : 0
    )
    const returningCustomerPercent = computed(() =>
      activeUsers.value ? 100 - newCustomerPercent.value : 0
    )

    // Previous period for customer type
    const prevNewUsers = computed(() =>
      props.sessionComparison.reduce((sum, item) => sum + (item.newUsers || 0), 0)
    )
    const newUsersDelta = computed(() =>
      calculateDelta(newUsers.value, prevNewUsers.value)
    )

    return {
      expandedCard,
      totalSessions,
      prevSessions,
      sessionsDelta,
      avgConversionRate,
      prevConversionRate,
      conversionRateDelta,
      totalConversions,
      prevTotalConversions,
      avgItemsPerTransaction,
      prevItemsPerTransaction,
      itemsPerTransactionDelta,
      totalTransactions,
      totalItems,
      prevTotalTransactions,
      prevTotalItems,
      newCustomerPercent,
      returningCustomerPercent,
      newUsers,
      returningUsers,
      activeUsers,
      prevNewUsers,
      newUsersDelta,
      hasComparisonData,
      hasBasketComparison,
      hasCustomerComparison,
      formatNumber,
      formatDelta,
      getDeltaClass,
      toggleExpand
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-2);
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.comparison-badge {
  font-size: 0.75rem;
  background: #f0f9ff;
  color: var(--primary);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1px solid #bae6fd;
}

.drivers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

.driver-card {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.driver-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--gray-200);
}

.driver-card.expanded {
  background: white;
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: var(--space-2);
}

.driver-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  margin-right: var(--space-2);
}

.driver-name {
  font-weight: 500;
  color: var(--gray-600);
  font-size: 0.875rem;
}

.driver-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: all 0.2s;
}

.expand-btn:hover {
  background: var(--gray-200);
  color: var(--gray-700);
}

.expand-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.driver-delta {
  font-size: 0.875rem;
  padding: 0.25rem 0;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-2);
}

.comparison-value {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-weight: 400;
}

.driver-delta.positive {
  color: #10b981;
}

.driver-delta.negative {
  color: #ef4444;
}

.driver-delta.neutral {
  color: var(--gray-500);
}

.expanded-details {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--gray-300);
  animation: slideDown 0.3s ease;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--gray-100);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--gray-600);
  font-weight: 500;
}

.detail-value {
  font-weight: 600;
  color: var(--gray-800);
}

.detail-value.positive {
  color: #10b981;
}

.detail-value.negative {
  color: #ef4444;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .drivers-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>