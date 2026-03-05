<template>
  <div class="charts-grid">
    <div
      v-for="chart in charts"
      :key="chart.ref"
      class="chart-card"
    >
      <!-- Chart Header -->
      <div class="chart-header">
        <h3>{{ chart.title }}</h3>

        <div class="chart-controls">
          <!-- Metric Selector -->
          <select
            :value="chart.metricValue"
            @change="$emit(chart.metricEvent, $event.target.value)"
            class="chart-select"
          >
            <option
              v-for="option in chart.metricOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <!-- Secondary Period View Toggle -->
          <div v-if="enableComparison" class="chart-view-toggle">
            <button
              v-for="view in chart.views"
              :key="view.value"
              :class="{ active: chart.viewValue === view.value }"
              @click="$emit(chart.viewEvent, view.value)"
            >
              {{ view.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Chart Canvas -->
      <div class="chart-container">
        <canvas :ref="chart.ref"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'ChartsSection',
  props: {
    locationRevenueData: Array,
    locationRevenueComparison: Array,
    locationSessionData: Array,
    locationSessionComparison: Array,
    enableComparison: Boolean,
    revenueChartMetric: String,
    sessionChartMetric: String,
    revenueChartView: String,
    sessionChartView: String
  },
  emits: [
    'update:revenueChartMetric',
    'update:sessionChartMetric',
    'update:revenueChartView',
    'update:sessionChartView'
  ],
  setup(props) {
    const revenueChart = ref(null)
    const sessionChart = ref(null)
    let chartInstances = {}

    // --- Colors ---
    const CHART_COLORS = {
      primary: 'rgba(59, 130, 246, 0.8)',
      secondary: 'rgba(156, 163, 175, 0.6)',
      success: 'rgba(16, 185, 129, 0.8)',
      danger: 'rgba(239, 68, 68, 0.8)',
      warning: 'rgba(245, 158, 11, 0.8)'
    }

    // --- Formatters ---
    const formatZAR = (value) =>
      value && !isNaN(value)
        ? new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value)
        : 'R0'

    const formatNumber = (value) =>
      value && !isNaN(value) ? new Intl.NumberFormat('en-ZA').format(value) : '0'

    const formatDelta = (delta) => {
      if (delta === null || delta === undefined || isNaN(delta)) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Math.abs(delta).toFixed(1)}%`
    }

    // --- Chart Config Factory ---
    const createChartConfig = (labels, datasets, options = {}) => ({
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: datasets.length > 1 },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const label = ctx.dataset.label || ''
                const value = ctx.parsed.y
                const formatted = ctx.dataset.formatter
                  ? ctx.dataset.formatter(value)
                  : value
                return `${label}: ${formatted}`
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#e5e7eb' },
            ticks: {
              callback: (value) =>
                options.yFormatter ? options.yFormatter(value) : value
            }
          },
          x: { grid: { display: false } }
        },
        ...options
      }
    })

    // --- Chart Update Logic ---
    const updateChart = ({
      ref,
      key,
      data,
      comparison,
      metric,
      view,
      metricLabels,
      color,
      deltaFields,
      formatter
    }) => {
      if (!ref.value || !data.length) return
      if (chartInstances[key]) chartInstances[key].destroy()

      const topLocations = data.slice(0, 8)
      const labels = topLocations.map((item) => item.city || 'Unknown')
      let datasets = []

      if (props.enableComparison && view === 'sideBySide') {
        datasets = [
          {
            label: 'Main Period',
            data: topLocations.map((item) => item[metric] || 0),
            backgroundColor: color,
            borderRadius: 8
          },
          {
            label: 'Secondary Period',
            data: topLocations.map((item) => {
              const comp = comparison.find((c) => c.city === item.city) || {}
              return comp[metric] || 0
            }),
            backgroundColor: CHART_COLORS.secondary,
            borderRadius: 8
          }
        ]
      } else if (props.enableComparison && view === 'delta') {
        const deltaField = deltaFields[metric]
        datasets = [
          {
            label: 'Change %',
            data: topLocations.map((item) => item[deltaField] || 0),
            backgroundColor: topLocations.map(
              (item) =>
                (item[deltaField] || 0) > 0
                  ? CHART_COLORS.success
                  : CHART_COLORS.danger
            ),
            borderRadius: 8,
            formatter: formatDelta
          }
        ]
      } else {
        datasets = [
          {
            label: metricLabels[metric] || metric,
            data: topLocations.map((item) => item[metric] || 0),
            backgroundColor: color,
            borderRadius: 8
          }
        ]
      }

      chartInstances[key] = new Chart(
        ref.value,
        createChartConfig(labels, datasets, { yFormatter: formatter })
      )
    }

    // --- Chart Configs ---
    const chartConfigs = [
      {
        ref: revenueChart,
        key: 'revenue',
        data: () => props.locationRevenueData,
        comparison: () => props.locationRevenueComparison,
        metric: () =>
          props.revenueChartMetric === 'revenue'
            ? 'purchaseRevenue'
            : props.revenueChartMetric,
        view: () => props.revenueChartView,
        metricLabels: {
          revenue: 'Revenue (ZAR)',
          transactions: 'Transactions',
          conversions: 'Conversions'
        },
        color: CHART_COLORS.primary,
        deltaFields: {
          revenue: 'revenueDelta',
          transactions: 'transactionsDelta',
          conversions: 'conversionsDelta'
        },
        formatter: () =>
          props.revenueChartMetric === 'revenue' ? formatZAR : formatNumber
      },
      {
        ref: sessionChart,
        key: 'session',
        data: () => props.locationSessionData,
        comparison: () => props.locationSessionComparison,
        metric: () => props.sessionChartMetric,
        view: () => props.sessionChartView,
        metricLabels: {
          sessions: 'Sessions',
          activeUsers: 'Active Users',
          newUsers: 'New Users',
          conversions: 'Conversions'
        },
        color: CHART_COLORS.success,
        deltaFields: {
          sessions: 'sessionsDelta',
          activeUsers: 'activeUsersDelta',
          newUsers: 'newUsersDelta',
          conversions: 'conversionsDelta'
        },
        formatter: () => formatNumber
      }
    ]

    // --- Lifecycle ---
    onMounted(() => {
      nextTick(() => {
        chartConfigs.forEach((cfg) =>
          updateChart({
            ref: cfg.ref,
            key: cfg.key,
            data: cfg.data(),
            comparison: cfg.comparison(),
            metric: cfg.metric(),
            view: cfg.view(),
            metricLabels: cfg.metricLabels,
            color: cfg.color,
            deltaFields: cfg.deltaFields,
            formatter: cfg.formatter()
          })
        )
      })
    })

    onBeforeUnmount(() => {
      Object.values(chartInstances).forEach((instance) => instance.destroy())
      chartInstances = {}
    })

    chartConfigs.forEach((cfg) => {
      watch(
        () => [cfg.metric(), cfg.view(), props.enableComparison, cfg.data()],
        () =>
          nextTick(() =>
            updateChart({
              ref: cfg.ref,
              key: cfg.key,
              data: cfg.data(),
              comparison: cfg.comparison(),
              metric: cfg.metric(),
              view: cfg.view(),
              metricLabels: cfg.metricLabels,
              color: cfg.color,
              deltaFields: cfg.deltaFields,
              formatter: cfg.formatter()
            })
          ),
        { deep: true }
      )
    })

    // --- Charts metadata for template rendering ---
   const charts = [
      {
        title: 'Revenue by Location (ZAR)',
        ref: 'revenueChart',
        metricValue: props.revenueChartMetric,
        metricEvent: 'update:revenueChartMetric',
        metricOptions: [
          { value: 'revenue', label: 'Revenue (ZAR)' },
          { value: 'transactions', label: 'Transactions' },
          { value: 'conversions', label: 'Conversions' }
        ],
        viewValue: props.revenueChartView,
        viewEvent: 'update:revenueChartView',
        views: [
          { value: 'sideBySide', label: 'Main vs Secondary' },
          { value: 'overlay', label: 'Overlay' },
          { value: 'delta', label: 'Change %' }
        ]
      },
      {
        title: 'Sessions & Users by Location',
        ref: 'sessionChart',
        metricValue: props.sessionChartMetric,
        metricEvent: 'update:sessionChartMetric',
        metricOptions: [
          { value: 'sessions', label: 'Sessions' },
          { value: 'activeUsers', label: 'Active Users' },
          { value: 'newUsers', label: 'New Users' },
          { value: 'conversions', label: 'Conversions' }
        ],
        viewValue: props.sessionChartView,
        viewEvent: 'update:sessionChartView',
        views: [
          { value: 'sideBySide', label: 'Main vs Secondary' },
          { value: 'overlay', label: 'Overlay' },
          { value: 'delta', label: 'Change %' }
        ]
      }
    ]

    return { revenueChart, sessionChart, charts }
  }
}
</script>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.chart-card {
  background: #fff;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.chart-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
}

.chart-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.chart-select {
  flex: 1;
  padding: var(--space-2);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--gray-600);
  background: #fff;
  cursor: pointer;
}

.chart-view-toggle {
  display: flex;
  gap: var(--space-1);
  background: var(--gray-100);
  padding: var(--space-1);
  border-radius: var(--radius-lg);
}

.chart-view-toggle button {
  padding: 0.375rem var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s;
}

.chart-view-toggle button.active {
  background: #fff;
  color: var(--gray-800);
  box-shadow: var(--shadow-sm);
}

.chart-container {
  position: relative;
  height: 300px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .chart-controls {
    width: 100%;
  }
}
</style>