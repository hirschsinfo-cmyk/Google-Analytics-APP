<template>
  <div class="customer-type-section">
    <!-- Header -->
    <div class="section-header">
      <h2>👥 Customer Type Breakdown</h2>
    </div>

    <!-- Metrics Card -->
    <div class="customer-metrics-card">
      <!-- New Customers -->
      <div class="customer-segment new">
        <div class="segment-header">
          <span class="segment-label">New Customers</span>
          <span class="segment-value">{{ formatNumber(newUsers) }}</span>
        </div>
        <div class="segment-stats">
          <div class="stat">
            <span class="stat-label">% of Total</span>
            <span class="stat-value">{{ newCustomerPercent.toFixed(1) }}%</span>
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
            <span class="stat-label">% of Total</span>
            <span class="stat-value">{{ returningCustomerPercent.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- Distribution Bar -->
      <div class="distribution-bar">
        <div
          class="bar-segment new"
          :style="{ width: newCustomerPercent + '%' }"
          aria-label="New Customers Segment"
        >
          <span class="bar-label" v-if="newCustomerPercent > 10">
            New {{ newCustomerPercent.toFixed(1) }}%
          </span>
        </div>
        <div
          class="bar-segment returning"
          :style="{ width: returningCustomerPercent + '%' }"
          aria-label="Returning Customers Segment"
        >
          <span class="bar-label" v-if="returningCustomerPercent > 10">
            Returning {{ returningCustomerPercent.toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'CustomerType',
  props: {
    engagementData: { type: Array, required: true }
  },
  setup(props) {
    // --- Computed values ---
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

    // --- Formatting ---
    const formatNumber = (value) =>
      new Intl.NumberFormat('en-ZA').format(value || 0)

    return {
      newUsers,
      returningUsers,
      newCustomerPercent,
      returningCustomerPercent,
      formatNumber
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
}

.section-header {
  margin-bottom: var(--space-4);
}
.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.customer-metrics-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.customer-segment {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
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
}
.segment-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
}

.segment-stats .stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  padding: var(--space-1) 0;
}
.stat-label { color: var(--gray-500); }
.stat-value { font-weight: 600; color: var(--gray-700); }

.distribution-bar {
  display: flex;
  height: 32px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: var(--space-2);
}
.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
}
.bar-segment.new { background: #3b82f6; }
.bar-segment.returning { background: #10b981; }
.bar-label {
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>