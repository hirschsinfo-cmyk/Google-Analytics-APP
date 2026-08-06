<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3>Sales Trend</h3>

      <div class="chart-controls">
        <div class="chart-view-toggle">
          <button
            v-for="option in granularityOptions"
            :key="option.value"
            :class="{ active: granularity === option.value }"
            @click="$emit('update:granularity', option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!seriesData.length" class="chart-empty">
      No trend data for the selected date range yet.
    </div>

    <div v-else class="chart-container">
      <canvas ref="trendChart"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'SalesTrendChart',
  props: {
    seriesData: { type: Array, default: () => [] },
    granularity: { type: String, default: 'day' }
  },
  emits: ['update:granularity'],
  setup(props) {
    const trendChart = ref(null)
    let chartInstance = null

    const granularityOptions = [
      { value: 'day', label: 'Daily' },
      { value: 'week', label: 'Weekly' },
      { value: 'month', label: 'Monthly' }
    ]

    const formatZAR = (value) =>
      value != null && !isNaN(value)
        ? new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value)
        : 'R0'

    const formatNumber = (value) =>
      value != null && !isNaN(value) ? new Intl.NumberFormat('en-ZA').format(value) : '0'

    // GA4 date-dimension values arrive as raw strings: 'YYYYMMDD' for day,
    // '2026W23'-style for yearWeek, '202606' for yearMonth. Turn them into
    // something readable for chart labels rather than showing raw digits.
    const formatLabel = (period, granularity) => {
      if (!period) return ''
      if (granularity === 'day' && /^\d{8}$/.test(period)) {
        const y = period.slice(0, 4), m = period.slice(4, 6), d = period.slice(6, 8)
        return new Date(`${y}-${m}-${d}`).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
      }
      if (granularity === 'month' && /^\d{6}$/.test(period)) {
        const y = period.slice(0, 4), m = period.slice(4, 6)
        return new Date(`${y}-${m}-01`).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
      }
      if (granularity === 'week' && /^\d{6}$/.test(period)) {
        // GA4 yearWeek format: YYYYWW
        return `Wk ${period.slice(4, 6)}, ${period.slice(0, 4)}`
      }
      return period
    }

    const renderChart = () => {
      if (!trendChart.value || !props.seriesData.length) return
      if (chartInstance) chartInstance.destroy()

      const labels = props.seriesData.map(p => formatLabel(p.period, props.granularity))
      const revenue = props.seriesData.map(p => p.purchaseRevenue || 0)
      const transactions = props.seriesData.map(p => p.transactions || 0)

      chartInstance = new Chart(trendChart.value, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Revenue (ZAR)',
              data: revenue,
              borderColor: 'rgba(16, 185, 129, 1)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              fill: true,
              tension: 0.3,
              yAxisID: 'y',
              pointRadius: 2,
              pointHoverRadius: 5
            },
            {
              label: 'Transactions',
              data: transactions,
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              fill: false,
              tension: 0.3,
              yAxisID: 'y1',
              pointRadius: 2,
              pointHoverRadius: 5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const label = ctx.dataset.label || ''
                  const value = ctx.parsed.y
                  const formatted = ctx.dataset.yAxisID === 'y' ? formatZAR(value) : formatNumber(value)
                  return `${label}: ${formatted}`
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              type: 'linear',
              position: 'left',
              beginAtZero: true,
              grid: { color: '#e5e7eb' },
              ticks: { callback: (value) => formatZAR(value) }
            },
            y1: {
              type: 'linear',
              position: 'right',
              beginAtZero: true,
              grid: { display: false },
              ticks: { callback: (value) => formatNumber(value) }
            }
          }
        }
      })
    }

    onMounted(() => nextTick(renderChart))
    onBeforeUnmount(() => { if (chartInstance) chartInstance.destroy() })
    watch(() => [props.seriesData, props.granularity], () => nextTick(renderChart), { deep: true })

    return { trendChart, granularityOptions }
  }
}
</script>

<style scoped>
.chart-card {
  background: #fff;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
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
  gap: var(--space-3);
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
  height: 320px;
}

.chart-empty {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
