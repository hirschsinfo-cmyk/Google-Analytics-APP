<template>
  <div class="customer-type-section">
    <!-- Header with Comparison Badge -->
    <div class="section-header">
      <h2>👥 Customer Type Breakdown</h2>
      <div v-if="enableComparison && hasComparisonData" class="comparison-badge">
        vs {{ formatDateRange(comparisonStartDate, comparisonEndDate) }}
      </div>
      <div v-else-if="enableComparison && !hasComparisonData" class="comparison-badge no-data">
        No comparison data
      </div>
    </div>

    <!-- Metrics Card -->
    <div class="customer-metrics-card">
      <!-- Current Period -->
      <div class="period-container current">
        <h3 class="period-title">Current Period</h3>
        
        <!-- New Customers -->
        <div class="customer-segment new">
          <div class="segment-header">
            <span class="segment-label">New Customers</span>
            <span class="segment-value">{{ formatNumber(newUsers) }}</span>
          </div>
          <div class="segment-stats">
            <div class="stat">
              <span class="stat-label">Share</span>
              <span class="stat-value">{{ newCustomerPercent.toFixed(1) }}%</span>
            </div>
            <div v-if="enableComparison && hasComparisonData" class="stat delta" :class="getDeltaClass(newUsersDelta)">
              <span class="stat-label">vs Comparison</span>
              <span class="stat-value">{{ formatDelta(newUsersDelta) }}</span>
            </div>
          </div>
        </div>

        <!-- Returning Customers -->
        <div class="customer-segment returning">
          <div class="segment-header">
            <span class="segment-label">Returning Customers</span>
            <span class="segment-value">{{ formatNumber(returningUsers) }}</span>
          </div>
          <div class="segment-stats">
            <div class="stat">
              <span class="stat-label">Share</span>
              <span class="stat-value">{{ returningCustomerPercent.toFixed(1) }}%</span>
            </div>
            <div v-if="enableComparison && hasComparisonData" class="stat delta" :class="getDeltaClass(returningUsersDelta)">
              <span class="stat-label">vs Comparison</span>
              <span class="stat-value">{{ formatDelta(returningUsersDelta) }}</span>
            </div>
          </div>
        </div>

        <!-- Distribution Bar -->
        <div class="distribution-bar">
          <div
            class="bar-segment new"
            :style="{ width: newCustomerPercent + '%' }"
            :aria-label="`New Customers: ${newCustomerPercent.toFixed(1)}%`"
          >
            <span class="bar-label" v-if="newCustomerPercent > 10">
              New {{ newCustomerPercent.toFixed(1) }}%
            </span>
          </div>
          <div
            class="bar-segment returning"
            :style="{ width: returningCustomerPercent + '%' }"
            :aria-label="`Returning Customers: ${returningCustomerPercent.toFixed(1)}%`"
          >
            <span class="bar-label" v-if="returningCustomerPercent > 10">
              Returning {{ returningCustomerPercent.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Comparison Period (Collapsible) -->
      <div v-if="enableComparison && hasComparisonData" class="period-container comparison">
        <button 
          class="period-toggle" 
          @click="showComparison = !showComparison"
          :aria-expanded="showComparison"
        >
          <span class="material-symbols-outlined">
            {{ showComparison ? 'expand_less' : 'expand_more' }}
          </span>
          <span>Comparison Period</span>
          <span class="comparison-dates">
            {{ formatDateRange(comparisonStartDate, comparisonEndDate) }}
          </span>
        </button>

        <div v-if="showComparison" class="period-content">
          <!-- New Customers Comparison -->
          <div class="customer-segment new comparison">
            <div class="segment-header">
              <span class="segment-label">New Customers</span>
              <span class="segment-value">{{ formatNumber(prevNewUsers) }}</span>
            </div>
            <div class="segment-stats">
              <div class="stat">
                <span class="stat-label">Share</span>
                <span class="stat-value">{{ prevNewCustomerPercent.toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <!-- Returning Customers Comparison -->
          <div class="customer-segment returning comparison">
            <div class="segment-header">
              <span class="segment-label">Returning Customers</span>
              <span class="segment-value">{{ formatNumber(prevReturningUsers) }}</span>
            </div>
            <div class="segment-stats">
              <div class="stat">
                <span class="stat-label">Share</span>
                <span class="stat-value">{{ prevReturningCustomerPercent.toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <!-- Comparison Period Distribution Bar -->
          <div class="distribution-bar">
            <div
              class="bar-segment new"
              :style="{ width: prevNewCustomerPercent + '%' }"
              :aria-label="`Comparison New Customers: ${prevNewCustomerPercent.toFixed(1)}%`"
            >
              <span class="bar-label" v-if="prevNewCustomerPercent > 10">
                New {{ prevNewCustomerPercent.toFixed(1) }}%
              </span>
            </div>
            <div
              class="bar-segment returning"
              :style="{ width: prevReturningCustomerPercent + '%' }"
              :aria-label="`Comparison Returning Customers: ${prevReturningCustomerPercent.toFixed(1)}%`"
            >
              <span class="bar-label" v-if="prevReturningCustomerPercent > 10">
                Returning {{ prevReturningCustomerPercent.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Comparison Data Message (subtle) -->
      <div v-else-if="enableComparison && !hasComparisonData" class="no-data-message">
        <span class="material-symbols-outlined">info</span>
        <span>No data available for comparison period</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

export default {
  name: 'CustomerType',
  props: {
    engagementData: { type: Array, required: true },
    engagementComparison: { type: Array, default: () => [] },
    enableComparison: { type: Boolean, default: false },
    comparisonStartDate: { type: String, default: '' },
    comparisonEndDate: { type: String, default: '' }
  },
  setup(props) {
    const showComparison = ref(false)

    // --- Helper Functions ---
    const calculateDelta = (current, previous) => {
      if (previous == null || previous === 0 || current == null) return null
      return ((current - previous) / previous) * 100
    }

    const formatNumber = (value) => {
      if (value == null || isNaN(value)) return '0'
      return new Intl.NumberFormat('en-ZA').format(value)
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

    // Check if we have comparison data
    const hasComparisonData = computed(() => 
      props.engagementComparison && props.engagementComparison.length > 0
    )

    // --- Current Period Calculations ---
    const newUsers = computed(() =>
      props.engagementData.reduce((sum, item) => sum + (item.newUsers || 0), 0)
    )

    const activeUsers = computed(() =>
      props.engagementData.reduce((sum, item) => sum + (item.activeUsers || 0), 0)
    )

    const returningUsers = computed(() => {
      const value = activeUsers.value - newUsers.value
      return value < 0 ? 0 : value
    })

    const newCustomerPercent = computed(() =>
      activeUsers.value ? (newUsers.value / activeUsers.value) * 100 : 0
    )

    const returningCustomerPercent = computed(() =>
      activeUsers.value ? (returningUsers.value / activeUsers.value) * 100 : 0
    )

    // --- Comparison Period Calculations ---
    const prevNewUsers = computed(() =>
      props.engagementComparison.reduce((sum, item) => sum + (item.newUsers || 0), 0)
    )

    const prevActiveUsers = computed(() =>
      props.engagementComparison.reduce((sum, item) => sum + (item.activeUsers || 0), 0)
    )

    const prevReturningUsers = computed(() => {
      const value = prevActiveUsers.value - prevNewUsers.value
      return value < 0 ? 0 : value
    })

    const prevNewCustomerPercent = computed(() =>
      prevActiveUsers.value ? (prevNewUsers.value / prevActiveUsers.value) * 100 : 0
    )

    const prevReturningCustomerPercent = computed(() =>
      prevActiveUsers.value ? (prevReturningUsers.value / prevActiveUsers.value) * 100 : 0
    )

    // --- Deltas ---
    const newUsersDelta = computed(() =>
      calculateDelta(newUsers.value, prevNewUsers.value)
    )

    const returningUsersDelta = computed(() =>
      calculateDelta(returningUsers.value, prevReturningUsers.value)
    )

    return {
      // Current period
      newUsers,
      returningUsers,
      newCustomerPercent,
      returningCustomerPercent,
      
      // Comparison period
      prevNewUsers,
      prevReturningUsers,
      prevNewCustomerPercent,
      prevReturningCustomerPercent,
      
      // Deltas
      newUsersDelta,
      returningUsersDelta,
      
      // UI state
      showComparison,
      hasComparisonData,
      
      // Helpers
      formatNumber,
      formatDelta,
      formatDateRange,
      getDeltaClass
    }
  }
}
</script>

<style scoped>
.customer-type-section {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.2s ease;
}

.customer-type-section:hover {
  box-shadow: var(--shadow-lg);
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
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.comparison-badge {
  font-size: 0.75rem;
  background: #f0f9ff;
  color: var(--primary);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1px solid #bae6fd;
  font-weight: 500;
  white-space: nowrap;
}

.comparison-badge.no-data {
  background: #f3f4f6;
  color: var(--gray-500);
  border-color: var(--gray-200);
}

.no-data-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--gray-500);
  font-size: 0.875rem;
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--gray-300);
}

.no-data-message .material-symbols-outlined {
  font-size: 1.25rem;
  color: var(--gray-400);
}

.customer-metrics-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.period-container {
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  transition: all 0.2s ease;
}

.period-container.current {
  background: white;
  border: 1px solid var(--gray-200);
}

.period-container.comparison {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.period-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  margin-bottom: var(--space-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.period-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gray-600);
  font-weight: 500;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.period-toggle:hover {
  color: var(--primary);
}

.period-toggle .material-symbols-outlined {
  font-size: 1.25rem;
}

.comparison-dates {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--gray-400);
  font-weight: 400;
}

.period-content {
  margin-top: var(--space-4);
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.customer-segment {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.customer-segment:last-child {
  margin-bottom: 0;
}

.customer-segment:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.customer-segment.comparison {
  background: white;
  border: 1px solid #e2e8f0;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.segment-label {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.segment-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
}

.segment-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--space-2);
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  padding: var(--space-1) 0;
}

.stat:not(:last-child) {
  border-bottom: 1px dashed var(--gray-200);
}

.stat.delta {
  border-bottom: none;
  background: white;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
  box-shadow: var(--shadow-sm);
}

.stat-label {
  color: var(--gray-500);
}

.stat-value {
  font-weight: 600;
  color: var(--gray-700);
}

.stat.delta .stat-value {
  font-weight: 700;
}

.stat.delta.positive .stat-value {
  color: #10b981;
}

.stat.delta.negative .stat-value {
  color: #ef4444;
}

.stat.delta.neutral .stat-value {
  color: var(--gray-500);
}

.distribution-bar {
  display: flex;
  height: 32px;
  background: var(--gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: var(--space-3);
  border: 1px solid var(--gray-200);
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
  min-width: 4px;
}

.bar-segment.new {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.bar-segment.returning {
  background: linear-gradient(135deg, #10b981, #059669);
}

.bar-label {
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  padding: 0 var(--space-2);
}

@media (max-width: 640px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .segment-stats {
    grid-template-columns: 1fr;
  }
  
  .bar-label {
    font-size: 0.7rem;
    padding: 0 var(--space-1);
  }
  
  .stat.delta {
    margin-top: var(--space-1);
  }
  
  .comparison-dates {
    margin-left: 0;
  }
}
</style>