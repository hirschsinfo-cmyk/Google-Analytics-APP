<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3>Sales by Country</h3>

      <div class="chart-controls">
        <span v-if="!loading && countries.length" class="country-count">
          {{ countries.length }} {{ countries.length === 1 ? 'country' : 'countries' }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="chart-empty">
      Loading country sales…
    </div>

    <div v-else-if="error" class="chart-empty error">
      {{ error }}
    </div>

    <div v-else-if="!countries.length" class="chart-empty">
      No sales recorded for the selected date range.
    </div>

    <div v-else class="table-wrapper">
      <table class="country-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              @click="setSort(col.key)"
              :class="{ sortable: true, active: sortKey === col.key }"
            >
              {{ col.label }}
              <span v-if="sortKey === col.key" class="sort-arrow">
                {{ sortDir === 'desc' ? '▼' : '▲' }}
              </span>
            </th>
            <th v-if="enableComparison">Δ Revenue</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleCountries" :key="row.country">
            <td class="country-name">{{ row.country || 'Unknown' }}</td>
            <td>{{ formatZAR(row.purchaseRevenue) }}</td>
            <td>{{ formatNumber(row.transactions) }}</td>
            <td>{{ formatNumber(row.conversions) }}</td>
            <td>{{ formatNumber(row.sessions) }}</td>
            <td v-if="enableComparison" :class="getDeltaClass(row.revenueDelta)">
              {{ formatDelta(row.revenueDelta) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="country-name">Total</td>
            <td>{{ formatZAR(totals.purchaseRevenue) }}</td>
            <td>{{ formatNumber(totals.transactions) }}</td>
            <td>{{ formatNumber(totals.conversions) }}</td>
            <td>{{ formatNumber(totals.sessions) }}</td>
            <td v-if="enableComparison"></td>
          </tr>
        </tfoot>
      </table>

      <button
        v-if="sortedCountries.length > collapsedLimit"
        class="view-more-btn"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'View less' : `View more (${sortedCountries.length - collapsedLimit} more)` }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'

export default {
  name: 'SalesByCountry',
  props: {
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    enableComparison: { type: Boolean, default: false },
    comparisonStartDate: { type: String, default: null },
    comparisonEndDate: { type: String, default: null }
  },
  setup(props) {
    const API_BASE = import.meta.env.VITE_API_BASE || 'https://conversions-api-0e62e1f06b26.herokuapp.com'

    const loading = ref(false)
    const error = ref(null)
    const rawCurrent = ref([])
    const rawComparison = ref([])

    const sortKey = ref('purchaseRevenue')
    const sortDir = ref('desc')

    // How many rows to show before the user has to click "View more".
    const collapsedLimit = 8
    const showAll = ref(false)

    const columns = [
      { key: 'country', label: 'Country' },
      { key: 'purchaseRevenue', label: 'Revenue' },
      { key: 'transactions', label: 'Transactions' },
      { key: 'conversions', label: 'Conversions' },
      { key: 'sessions', label: 'Sessions' }
    ]

    const formatZAR = (value) =>
      value != null && !isNaN(value)
        ? new Intl.NumberFormat('en-ZA', {
            style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0
          }).format(value)
        : 'R0'

    const formatNumber = (value) =>
      value != null && !isNaN(value) ? new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(value) : '0'

    const formatDelta = (delta) => {
      if (delta === null || delta === undefined || isNaN(delta)) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Number(delta).toFixed(1)}%`
    }

    const getDeltaClass = (delta) => {
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    }

    const calculateDelta = (current, previous) => {
      if (previous == null || previous === 0 || current == null) return null
      return ((current - previous) / previous) * 100
    }

    // Merge current + comparison rows by country, same keyed-join approach
    // used elsewhere in the dashboard (processors.basketSize, etc.)
    const countries = computed(() => {
      const comparisonMap = new Map(rawComparison.value.map((item) => [item.country, item]))
      return rawCurrent.value.map((item) => {
        const comp = comparisonMap.get(item.country) || {}
        return {
          ...item,
          revenueDelta: calculateDelta(item.purchaseRevenue, comp.purchaseRevenue)
        }
      })
    })

    const totals = computed(() => {
      const acc = { purchaseRevenue: 0, transactions: 0, conversions: 0, sessions: 0 }
      for (const row of countries.value) {
        acc.purchaseRevenue += row.purchaseRevenue || 0
        acc.transactions += row.transactions || 0
        acc.conversions += row.conversions || 0
        acc.sessions += row.sessions || 0
      }
      return acc
    })

    const setSort = (key) => {
      if (sortKey.value === key) {
        sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
      } else {
        sortKey.value = key
        sortDir.value = 'desc'
      }
    }

    const sortedCountries = computed(() => {
      const list = [...countries.value]
      const dir = sortDir.value === 'desc' ? -1 : 1
      list.sort((a, b) => {
        const aVal = a[sortKey.value]
        const bVal = b[sortKey.value]
        if (typeof aVal === 'string' || typeof bVal === 'string') {
          return dir * String(aVal || '').localeCompare(String(bVal || ''))
        }
        return dir * ((aVal || 0) - (bVal || 0))
      })
      return list
    })

    const visibleCountries = computed(() =>
      showAll.value ? sortedCountries.value : sortedCountries.value.slice(0, collapsedLimit)
    )

    const fetchSalesByCountry = async () => {
      loading.value = true
      error.value = null
      showAll.value = false

      try {
        const username = localStorage.getItem('username') || ''
        const password = localStorage.getItem('password') || ''

        const url = new URL(`${API_BASE}/analytics/sales-by-country`)
        url.searchParams.append('startDate', props.startDate)
        url.searchParams.append('endDate', props.endDate)

        if (props.enableComparison && props.comparisonStartDate && props.comparisonEndDate) {
          url.searchParams.append('compareStartDate', props.comparisonStartDate)
          url.searchParams.append('compareEndDate', props.comparisonEndDate)
        }

        const res = await fetch(url, {
          headers: {
            'x-username': username,
            'x-password': password
          }
        })

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`)
        }

        const data = await res.json()
        rawCurrent.value = data.currentPeriod || []
        rawComparison.value = data.comparisonPeriod || []
      } catch (err) {
        console.error('Error fetching sales by country:', err)
        error.value = 'Failed to load country sales data.'
        rawCurrent.value = []
        rawComparison.value = []
      } finally {
        loading.value = false
      }
    }

    watch(
      () => [props.startDate, props.endDate, props.enableComparison, props.comparisonStartDate, props.comparisonEndDate],
      fetchSalesByCountry
    )

    onMounted(fetchSalesByCountry)

    return {
      loading,
      error,
      countries,
      sortedCountries,
      visibleCountries,
      showAll,
      collapsedLimit,
      totals,
      columns,
      sortKey,
      sortDir,
      setSort,
      formatZAR,
      formatNumber,
      formatDelta,
      getDeltaClass
    }
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

.country-count {
  font-size: 0.8rem;
  color: var(--gray-500);
  font-weight: 500;
}

.chart-empty {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  font-size: 0.9rem;
}

.chart-empty.error {
  color: var(--danger);
}

.table-wrapper {
  overflow-x: auto;
}

.country-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.country-table th,
.country-table td {
  padding: var(--space-3) var(--space-4);
  text-align: right;
  white-space: nowrap;
}

.country-table th:first-child,
.country-table td:first-child {
  text-align: left;
}

.country-table thead th {
  color: var(--gray-500);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 2px solid var(--gray-200);
  cursor: pointer;
  user-select: none;
}

.country-table thead th.sortable:hover {
  color: var(--gray-800);
}

.country-table thead th.active {
  color: var(--primary);
}

.sort-arrow {
  font-size: 0.65rem;
  margin-left: 2px;
}

.country-table tbody tr {
  border-bottom: 1px solid var(--gray-100);
}

.country-table tbody tr:hover {
  background: var(--gray-50);
}

.country-name {
  font-weight: 600;
  color: var(--gray-800);
}

.country-table tfoot td {
  font-weight: 700;
  color: var(--gray-900);
  border-top: 2px solid var(--gray-200);
  padding-top: var(--space-4);
}

.view-more-btn {
  display: block;
  width: 100%;
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.view-more-btn:hover {
  background: var(--gray-100);
  border-color: var(--primary);
}

.positive { color: var(--success); font-weight: 600; }
.negative { color: var(--danger); font-weight: 600; }
.neutral { color: var(--gray-500); font-weight: 600; }

@media (max-width: 768px) {
  .country-table {
    font-size: 0.8rem;
  }
  .country-table th,
  .country-table td {
    padding: var(--space-2) var(--space-3);
    
  }
}
</style>