<template>
  <div class="customer-segments-section">
    <!-- Header -->
    <div class="section-header">
      <h2>👥 Customer Segments</h2>
      <div v-if="insights" class="header-insights">
        <span class="insight-badge" :class="insights.trend">
          {{ insights.driver }}
        </span>
      </div>
    </div>

    <div class="segments-grid">
      <!-- Main Segments Card -->
      <div class="segments-card main-card">
        <div class="segments-comparison">
          <!-- New Customers -->
          <div class="segment new-customers">
            <div class="segment-header">
              <span class="segment-label">New Customers</span>
              <span class="segment-value">{{ formatNumber(customerData.newUsers) }}</span>
            </div>
            <div class="segment-progress">
              <div class="progress-bar">
                <div class="progress-fill new" :style="{ width: newCustomerPercent + '%' }"></div>
              </div>
              <span class="progress-percent">{{ newCustomerPercent }}%</span>
            </div>
            <div class="segment-metrics">
              <div class="metric">
                <span class="metric-label">Conversion Rate</span>
                <span class="metric-value">{{ formatPercent(customerData.newConversionRate) }}</span>
                <span v-if="enableComparison" class="metric-delta" :class="getDeltaClass(customerData.newConversionRateDelta)">
                  {{ formatDelta(customerData.newConversionRateDelta) }}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">Avg Order</span>
                <span class="metric-value">{{ formatZAR(customerData.newAvgOrder) }}</span>
                <span v-if="enableComparison" class="metric-delta" :class="getDeltaClass(customerData.newAvgOrderDelta)">
                  {{ formatDelta(customerData.newAvgOrderDelta) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Returning Customers -->
          <div class="segment returning-customers">
            <div class="segment-header">
              <span class="segment-label">Returning Customers</span>
              <span class="segment-value">{{ formatNumber(customerData.returningUsers) }}</span>
            </div>
            <div class="segment-progress">
              <div class="progress-bar">
                <div class="progress-fill returning" :style="{ width: returningCustomerPercent + '%' }"></div>
              </div>
              <span class="progress-percent">{{ returningCustomerPercent }}%</span>
            </div>
            <div class="segment-metrics">
              <div class="metric">
                <span class="metric-label">Conversion Rate</span>
                <span class="metric-value">{{ formatPercent(customerData.returningConversionRate) }}</span>
                <span v-if="enableComparison" class="metric-delta" :class="getDeltaClass(customerData.returningConversionRateDelta)">
                  {{ formatDelta(customerData.returningConversionRateDelta) }}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">Avg Order</span>
                <span class="metric-value">{{ formatZAR(customerData.returningAvgOrder) }}</span>
                <span v-if="enableComparison" class="metric-delta" :class="getDeltaClass(customerData.returningAvgOrderDelta)">
                  {{ formatDelta(customerData.returningAvgOrderDelta) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue Contribution -->
        <div class="revenue-contribution">
          <h4>Revenue Contribution</h4>
          <div class="contribution-bars">
            <div class="contribution-item">
              <span class="label">New Customers</span>
              <div class="bar-container">
                <div class="bar new" :style="{ width: newRevenuePercent + '%' }"></div>
              </div>
              <span class="value">{{ formatZAR(customerData.newRevenue) }}</span>
              <span class="percent">{{ newRevenuePercent }}%</span>
            </div>
            <div class="contribution-item">
              <span class="label">Returning Customers</span>
              <div class="bar-container">
                <div class="bar returning" :style="{ width: returningRevenuePercent + '%' }"></div>
              </div>
              <span class="value">{{ formatZAR(customerData.returningRevenue) }}</span>
              <span class="percent">{{ returningRevenuePercent }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Insights Card -->
      <div class="segments-card insights-card">
        <h3>🔍 Key Insights</h3>
        <div class="insights-list">
          <div v-if="customerData.returningConversionRate > customerData.newConversionRate * 1.5" class="insight-item">
            <span class="insight-icon">🔄</span>
            <div class="insight-content">
              <strong>Returning customers convert {{ calculateFactor(customerData.returningConversionRate, customerData.newConversionRate) }}x better</strong>
              <span>Focus on retention & loyalty programs</span>
            </div>
          </div>

          <div v-if="customerData.newAvgOrder > customerData.returningAvgOrder" class="insight-item">
            <span class="insight-icon">🆕</span>
            <div class="insight-content">
              <strong>New customers spend {{ formatZAR(customerData.newAvgOrder - customerData.returningAvgOrder) }} more per order</strong>
              <span>First-time buyers are purchasing premium items</span>
            </div>
          </div>

          <div v-else class="insight-item">
            <span class="insight-icon">⭐</span>
            <div class="insight-content">
              <strong>Returning customers spend {{ formatZAR(customerData.returningAvgOrder - customerData.newAvgOrder) }} more per order</strong>
              <span>Loyal customers have higher trust & basket size</span>
            </div>
          </div>

          <div v-if="newCustomerPercent > 70" class="insight-item">
            <span class="insight-icon">📈</span>
            <div class="insight-content">
              <strong>High new customer acquisition ({{ newCustomerPercent }}%)</strong>
              <span>Focus on onboarding & first-purchase experience</span>
            </div>
          </div>

          <div v-else-if="returningCustomerPercent > 50" class="insight-item">
            <span class="insight-icon">💪</span>
            <div class="insight-content">
              <strong>Strong retention rate ({{ returningCustomerPercent }}%)</strong>
              <span>Loyal customer base is growing</span>
            </div>
          </div>
        </div>

        <!-- Correlation with Sales -->
        <div v-if="salesDriver" class="correlation-box">
          <h4>📊 Sales Driver Analysis</h4>
          <p class="correlation-text">
            <span class="driver-highlight">{{ salesDriver.segment }}</span>
            {{ salesDriver.insight }}
          </p>
          <div class="correlation-metrics">
            <div class="correlation-metric">
              <span>When {{ salesDriver.segment }} ↑10%</span>
              <span class="impact positive">Sales ↑{{ salesDriver.impact }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trend Chart -->
    <div v-if="showTrends" class="trend-section">
      <div class="trend-header">
        <h3>Customer Segment Trends</h3>
        <div class="trend-controls">
          <button 
            v-for="period in trendPeriods" 
            :key="period.value"
            :class="{ active: selectedTrendPeriod === period.value }"
            @click="selectedTrendPeriod = period.value"
          >
            {{ period.label }}
          </button>
        </div>
      </div>
      <div class="trend-chart-container">
        <canvas ref="trendChart"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'CustomerSegments',
  props: {
    customerData: {
      type: Object,
      required: true,
      validator: (value) => {
        const required = [
          'newUsers', 'returningUsers',
          'newConversionRate', 'returningConversionRate',
          'newAvgOrder', 'returningAvgOrder',
          'newRevenue', 'returningRevenue'
        ]
        return required.every(field => field in value)
      }
    },
    enableComparison: { type: Boolean, default: false },
    showTrends: { type: Boolean, default: true },
    trendData: { type: Object, default: () => ({}) }
  },
  emits: ['periodChange'],
  setup(props, { emit }) {
    const selectedTrendPeriod = ref('30d')
    const trendChart = ref(null)
    let chartInstance = null

    // --- Trend Periods ---
    const trendPeriods = [
      { value: '7d', label: '7 Days' },
      { value: '30d', label: '30 Days' },
      { value: '90d', label: '90 Days' }
    ]

    // --- Computed Percentages ---
    const totalUsers = computed(() =>
      (props.customerData.newUsers || 0) + (props.customerData.returningUsers || 0)
    )

    const newCustomerPercent = computed(() =>
      totalUsers.value
        ? ((props.customerData.newUsers / totalUsers.value) * 100).toFixed(1)
        : 0
    )

    const returningCustomerPercent = computed(() =>
      totalUsers.value
        ? ((props.customerData.returningUsers / totalUsers.value) * 100).toFixed(1)
        : 0
    )

    const totalRevenue = computed(() =>
      (props.customerData.newRevenue || 0) + (props.customerData.returningRevenue || 0)
    )

    const newRevenuePercent = computed(() =>
      totalRevenue.value
        ? ((props.customerData.newRevenue / totalRevenue.value) * 100).toFixed(1)
        : 0
    )

    const returningRevenuePercent = computed(() =>
      totalRevenue.value
        ? ((props.customerData.returningRevenue / totalRevenue.value) * 100).toFixed(1)
        : 0
    )

    // --- Sales Driver Analysis ---
    const salesDriver = computed(() => {
      const newGrowth = props.customerData.newUsersDelta || 0
      const returningGrowth = props.customerData.returningUsersDelta || 0
      const salesGrowth = props.customerData.salesDelta || 0

      if (Math.abs(newGrowth) > Math.abs(returningGrowth)) {
        return {
          segment: 'New Customers',
          insight: 'growth correlates with sales performance',
          impact: (salesGrowth / Math.abs(newGrowth) * 10).toFixed(1)
        }
      }
      return {
        segment: 'Returning Customers',
        insight: 'loyalty is driving sales',
        impact: (salesGrowth / Math.abs(returningGrowth) * 10).toFixed(1)
      }
    })

    // --- Insights ---
    const insights = computed(() => {
      if (props.customerData.returningConversionRate > props.customerData.newConversionRate * 2) {
        return { trend: 'positive', driver: 'Returning customers convert at 2x rate' }
      } else if (newCustomerPercent.value > 70) {
        return { trend: 'neutral', driver: 'High acquisition period' }
      }
      return null
    })

    // --- Formatting Utilities ---
    const formatNumber = (value) =>
      value && !isNaN(value) ? new Intl.NumberFormat('en-ZA').format(value) : '0'

    const formatZAR = (value) =>
      value && !isNaN(value)
        ? new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(value)
        : 'R0.00'

    const formatPercent = (value) =>
      value && !isNaN(value)
        ? new Intl.NumberFormat('en-ZA', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          }).format(value / 100)
        : '0%'

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

    const calculateFactor = (higher, lower) =>
      !lower || lower === 0 ? 'N/A' : (higher / lower).toFixed(1)

    // --- Trend Chart ---
    const initTrendChart = () => {
      if (!trendChart.value || !props.trendData.labels) return
      if (chartInstance) chartInstance.destroy()

      chartInstance = new Chart(trendChart.value, {
        type: 'line',
        data: {
          labels: props.trendData.labels,
          datasets: [
            {
              label: 'New Customers',
              data: props.trendData.newUsers,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Returning Customers',
              data: props.trendData.returningUsers,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#e5e7eb' }
            }
          }
        }
      })
    }

    // --- Lifecycle ---
    onMounted(() => {
      if (props.showTrends && props.trendData.labels) initTrendChart()
    })

    onBeforeUnmount(() => {
      if (chartInstance) chartInstance.destroy()
    })

    watch([() => props.trendData, selectedTrendPeriod], () => {
      if (props.showTrends) {
        setTimeout(initTrendChart, 100)
        emit('periodChange', selectedTrendPeriod.value)
      }
    })

    return {
      newCustomerPercent,
      returningCustomerPercent,
      newRevenuePercent,
      returningRevenuePercent,
      salesDriver,
      insights,
      trendPeriods,
      selectedTrendPeriod,
      trendChart,
      formatNumber,
      formatZAR,
      formatPercent,
      formatDelta,
      getDeltaClass,
      calculateFactor
    }
  }
}
</script>

<style scoped>
.customer-segments-section {
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
  margin-bottom: var(--space-6);
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.header-insights {
  display: flex;
  gap: var(--space-2);
}

.insight-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.insight-badge.positive {
  background: #d1fae5;
  color: #065f46;
}

.insight-badge.neutral {
  background: #fef3c7;
  color: #92400e;
}

.segments-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
}

.segments-card {
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}

.main-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.segments-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.segment {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.segment.new-customers {
  border-left: 4px solid #3b82f6;
}

.segment.returning-customers {
  border-left: 4px solid #10b981;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.segment-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-600);
}

.segment-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
}

.segment-progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.new {
  background: #3b82f6;
}

.progress-fill.returning {
  background: #10b981;
}

.progress-percent {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-600);
  min-width: 45px;
  text-align: right;
}

.segment-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  padding: var(--space-1) 0;
  border-bottom: 1px dashed var(--gray-200);
}

.metric:last-child {
  border-bottom: none;
}

.metric-label {
  color: var(--gray-500);
}

.metric-value {
  font-weight: 600;
  color: var(--gray-700);
}

.metric-delta {
  font-size: 0.7rem;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
  margin-left: var(--space-1);
}

.metric-delta.positive {
  background: #d1fae5;
  color: #065f46;
}

.metric-delta.negative {
  background: #fee2e2;
  color: #991b1b;
}

.revenue-contribution {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.revenue-contribution h4 {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--space-3);
}

.contribution-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.contribution-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.75rem;
}

.contribution-item .label {
  width: 100px;
  color: var(--gray-600);
}

.bar-container {
  flex: 1;
  height: 24px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.3s ease;
}

.bar.new {
  background: #3b82f6;
}

.bar.returning {
  background: #10b981;
}

.contribution-item .value {
  min-width: 80px;
  text-align: right;
  font-weight: 600;
  color: var(--gray-800);
}

.contribution-item .percent {
  min-width: 45px;
  text-align: right;
  color: var(--gray-500);
}

.insights-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.insights-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.insight-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  background: white;
  border-radius: var(--radius-lg);
  border-left: 3px solid transparent;
}

.insight-item:has(.positive) {
  border-left-color: #10b981;
}

.insight-icon {
  font-size: 1.25rem;
}

.insight-content {
  flex: 1;
}

.insight-content strong {
  display: block;
  font-size: 0.875rem;
  color: var(--gray-800);
  margin-bottom: var(--space-1);
}

.insight-content span {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.correlation-box {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-top: var(--space-2);
  border: 1px solid #e5e7eb;
}

.correlation-box h4 {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--space-2);
}

.correlation-text {
  font-size: 0.875rem;
  color: var(--gray-700);
  margin-bottom: var(--space-3);
  line-height: 1.5;
}

.driver-highlight {
  font-weight: 700;
  color: var(--primary);
}

.correlation-metrics {
  background: var(--gray-50);
  border-radius: var(--radius-md);
  padding: var(--space-2);
}

.correlation-metric {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--gray-600);
}

.impact.positive {
  color: #10b981;
  font-weight: 600;
}

.trend-section {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--gray-200);
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.trend-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
}

.trend-controls {
  display: flex;
  gap: var(--space-1);
  background: var(--gray-100);
  padding: var(--space-1);
  border-radius: var(--radius-lg);
}

.trend-controls button {
  padding: var(--space-1) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s;
}

.trend-controls button.active {
  background: white;
  color: var(--gray-800);
  box-shadow: var(--shadow-sm);
}

.trend-chart-container {
  height: 250px;
  position: relative;
}

@media (max-width: 1024px) {
  .segments-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .segments-comparison {
    grid-template-columns: 1fr;
  }
  
  .contribution-item {
    flex-wrap: wrap;
  }
  
  .contribution-item .label {
    width: 100%;
  }
  
  .bar-container {
    width: 100%;
  }
}
</style>