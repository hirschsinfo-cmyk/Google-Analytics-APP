<template>
  <div class="tables-section">
    <!-- Section Header -->
    <div class="section-header" @click="$emit('toggleTables')">
      <h2>Detailed Data</h2>
      <span class="material-symbols-outlined expand-icon">
        {{ showTables ? 'expand_less' : 'expand_more' }}
      </span>
    </div>

    <!-- Tables Stack -->
    <div v-if="showTables && hasData" class="tables-stack">
      <!-- Location Performance Table -->
      <div class="table-card">
        <div class="table-header">
          <h3>Location Performance Details</h3>
          <div class="table-tabs">
            <button
              v-for="tab in locationTabs"
              :key="tab.value"
              :class="{ active: activeLocationTab === tab.value }"
              @click="$emit('update:activeLocationTab', tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr class="main-headers">
                <th>City</th>
                <th>Country</th>
                <th
                  v-for="col in currentLocationColumns"
                  :key="col.key"
                  :colspan="enableComparison ? 2 : 1"
                  :title="col.tooltip"
                >
                  {{ col.label }}
                  <span v-if="enableComparison" class="period-badge">Value / Δ</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in currentLocationData"
                :key="getLocationKey(item)"
              >
                <td>{{ item.city || '—' }}</td>
                <td>{{ item.country || '—' }}</td>
                <template v-for="col in currentLocationColumns" :key="col.key">
                  <td class="main-value">{{ formatValue(getValue(item, col), col.format) }}</td>
                  <td v-if="enableComparison" class="comparison-value">
                    <span :class="getDeltaClass(getDeltaValue(item, col))">
                      {{ formatDelta(getDeltaValue(item, col)) }}
                    </span>
                  </td>
                </template>
              </tr>
              <tr v-if="!currentLocationData.length">
                <td :colspan="locationColspan" class="empty">No location data available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Source Analysis Table -->
      <div class="table-card">
        <div class="table-header">
          <h3>Source Analysis</h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr class="main-headers">
                <th>Channel</th>
                <th>Device</th>
                <th>Campaign</th>
                <th v-for="col in sourceColumns" :key="col.key" :colspan="enableComparison ? 2 : 1" :title="col.tooltip">
                  {{ col.label }}
                  <span v-if="enableComparison" class="period-badge">Value / Δ</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in paginatedSourceData"
                :key="getSourceKey(item, idx)"
              >
                <td>
                  <span class="channel-badge" :class="getChannelClass(item.channel)">
                    {{ item.channel || 'Other' }}
                  </span>
                </td>
                <td><span class="device-badge">{{ item.deviceCategory || '—' }}</span></td>
                <td
                  class="campaign-cell"
                  @click.stop="toggleCampaign(item, idx)"
                  :title="item.campaignName || '—'"
                >
                  <span v-if="isExpanded(item, idx)">
                    {{ item.campaignName || '—' }} <span class="toggle-icon">−</span>
                  </span>
                  <span v-else>
                    {{ truncateString(item.campaignName, 25) || '—' }} <span class="toggle-icon">+</span>
                  </span>
                </td>
                <template v-for="col in sourceColumns" :key="col.key">
                  <td class="main-value">{{ formatValue(getSourceValue(item, col), col.format) }}</td>
                  <td v-if="enableComparison" class="comparison-value">
                    <span :class="getDeltaClass(getSourceDelta(item, col))">
                      {{ formatDelta(getSourceDelta(item, col)) }}
                    </span>
                  </td>
                </template>
              </tr>
              <tr v-if="!sourceData.length">
                <td :colspan="sourceColspan" class="empty">No source data available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Loading / No Data State -->
    <div v-else-if="showTables" class="loading-state">
      {{ loadingMessage }}
    </div>
  </div>
</template>

<script>
// ==================== CONSTANTS & CONFIG ====================
const CHANNEL_CLASSES = {
  organic: 'organic',
  paid: 'paid',
  direct: 'direct',
  referral: 'referral',
  social: 'social',
  other: 'other'
}

const LOCATION_TABS = [
  { value: 'session', label: 'Sessions & Users' },
  { value: 'revenue', label: 'Revenue (ZAR)' }
]

// ==================== FORMATTERS ====================
const formatters = {
  ZAR: (v) => {
    if (v == null || isNaN(Number(v))) return 'R0'
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(Number(v))
  },
  
  number: (v) => {
    if (v == null || isNaN(Number(v))) return '0'
    // maximumFractionDigits: 0 -- GA4's "conversions" metric can return
    // fractional values (e.g. 2225.303) when a property uses data-driven
    // attribution, which splits credit for one conversion across several
    // channels. That's expected GA4 behavior, not an error, but showing
    // 3 decimal digits on a "count" column reads as extra digits at a
    // glance (en-ZA formatting uses a space for thousands and a comma for
    // the decimal point, so "2 225,303" is easy to misread as 2.2 million
    // rather than ~2225.3). Rounding for display avoids that confusion.
    return new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(Number(v))
  },
  
  percent: (p) => {
    if (p == null || isNaN(Number(p))) return '0%'
    // sessionConversionRate is normalized to percentage-point form
    // (e.g. 3.4 for 3.4%) once, in Dashboard.vue's fetchAllData, so no
    // guessing at the unit is needed here.
    return `${Number(p).toFixed(1)}%`
  },
  
  truncate: (str, max) => {
    if (!str) return '—'
    return str.length > max ? str.substring(0, max) + '…' : str
  },
  
  delta: (d) => {
    if (d == null || isNaN(Number(d))) return '—'
    const sign = d > 0 ? '+' : ''
    return `${sign}${Math.abs(d).toFixed(1)}%`
  }
}

// ==================== COLUMN DEFINITIONS ====================
const CONVERSIONS_TOOLTIP = 'Counts all GA4 key events (e.g. add to cart, view item), not just purchases'
const CONV_RATE_TOOLTIP = 'Based on all key events, not just purchases -- can exceed 100% if a session triggers multiple key events'

const COLUMNS = {
  session: [
    { key: 'sessions', label: 'Sessions', format: 'number', deltaKey: 'sessionsDelta' },
    { key: 'conversions', label: 'Conversions', format: 'number', deltaKey: 'conversionsDelta', tooltip: CONVERSIONS_TOOLTIP },
    { key: 'sessionConversionRate', label: 'Conv. Rate', format: 'percent', deltaKey: 'conversionRateDelta', tooltip: CONV_RATE_TOOLTIP },
    { key: 'activeUsers', label: 'Active Users', format: 'number', deltaKey: 'activeUsersDelta' },
    { key: 'newUsers', label: 'New Users', format: 'number', deltaKey: 'newUsersDelta' }
  ],
  
  revenue: [
    { key: 'purchaseRevenue', label: 'Revenue (ZAR)', format: 'ZAR', deltaKey: 'revenueDelta' },
    { key: 'transactions', label: 'Transactions', format: 'number', deltaKey: 'transactionsDelta' },
    { key: 'conversions', label: 'Conversions', format: 'number', deltaKey: 'conversionsDelta', tooltip: CONVERSIONS_TOOLTIP }
  ],
  
  source: [
    { key: 'sessions', label: 'Sessions', format: 'number', deltaKey: 'sessionsDelta' },
    { key: 'conversions', label: 'Conversions', format: 'number', deltaKey: 'conversionsDelta', tooltip: CONVERSIONS_TOOLTIP },
    { 
      key: 'sessionConversionRate', 
      label: 'Conv. Rate', 
      format: 'percent', 
      deltaKey: 'conversionRateDelta',
      tooltip: CONV_RATE_TOOLTIP,
      // If the rate isn't pre-calculated, compute it from sessions and conversions
      compute: (item) => item.conversions && item.sessions ? 
               (item.conversions / item.sessions) * 100 : 0
    }
  ]
}

export default {
  name: 'DataTables',
  
  props: {
    // Main datasets
    locationSessionData: { type: Array, default: () => [] },
    locationRevenueData: { type: Array, default: () => [] },
    sourceData: { type: Array, default: () => [] },

    // Controls
    enableComparison: { type: Boolean, default: false },
    activeLocationTab: { type: String, default: 'session' },
    showTables: { type: Boolean, default: false }
  },
  
  emits: ['update:activeLocationTab', 'toggleTables'],

  data() {
    return {
      expandedCampaigns: new Set(),
      locationTabs: LOCATION_TABS
    }
  },

  computed: {
    hasData() {
      return [this.locationSessionData, this.locationRevenueData, this.sourceData]
        .some(arr => arr?.length > 0)
    },

    loadingMessage() {
      return this.hasData ? 'Loading...' : 'No data available for selected period'
    },

    currentLocationData() {
      const data = this.activeLocationTab === 'session' 
        ? this.locationSessionData 
        : this.locationRevenueData
      return (data || []).slice(0, 10)
    },

    currentLocationColumns() {
      return this.activeLocationTab === 'session' ? COLUMNS.session : COLUMNS.revenue
    },

    paginatedSourceData() {
      return (this.sourceData || []).slice(0, 8)
    },

    sourceColumns() {
      return COLUMNS.source
    },

    locationColspan() {
      const baseCols = 2
      const metricCount = this.activeLocationTab === 'session' ? 5 : 3
      return baseCols + (this.enableComparison ? metricCount * 2 : metricCount)
    },

    sourceColspan() {
      const baseCols = 3
      const metricCount = 3
      return baseCols + (this.enableComparison ? metricCount * 2 : metricCount)
    }
  },

  methods: {
    // Get value from item, computing if necessary
    getValue(item, col) {
      // If there's a compute function for this column, use it
      if (col.compute) {
        return col.compute(item)
      }
      // Otherwise return the direct value
      return item[col.key]
    },

    // Special handling for source values
    getSourceValue(item, col) {
      // sessionConversionRate is already normalized to percentage-point
      // form upstream (see Dashboard.vue fetchAllData) — no unit-guessing
      // needed here.
      return this.getValue(item, col)
    },

    formatValue(value, formatType) {
      return formatters[formatType](value)
    },

    formatDelta(value) {
      return formatters.delta(value)
    },

    getDeltaClass(delta) {
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    },

    getDeltaValue(item, col) {
      if (!this.enableComparison) return null
      return item[col.deltaKey]
    },

    getSourceDelta(item, col) {
      if (!this.enableComparison) return null
      return item[col.deltaKey]
    },

    getLocationKey(item) {
      return `${item?.city || ''}|${item?.country || ''}`
    },

    getSourceKey(item, idx) {
      return `${item?.channel || ''}|${item?.deviceCategory || ''}|${item?.campaignName || ''}|${idx}`
    },

    truncateString(str, max) {
      return formatters.truncate(str, max)
    },

    isExpanded(item, idx) {
      return this.expandedCampaigns.has(this.getSourceKey(item, idx))
    },

    toggleCampaign(item, idx) {
      const key = this.getSourceKey(item, idx)
      if (this.expandedCampaigns.has(key)) {
        this.expandedCampaigns.delete(key)
      } else {
        this.expandedCampaigns.add(key)
      }
      this.expandedCampaigns = new Set(this.expandedCampaigns)
    },

    getChannelClass(channel) {
      if (!channel) return CHANNEL_CLASSES.other
      const v = channel.toLowerCase()
      if (v.includes('organic')) return CHANNEL_CLASSES.organic
      if (v.includes('paid')) return CHANNEL_CLASSES.paid
      if (v.includes('direct')) return CHANNEL_CLASSES.direct
      if (v.includes('referral')) return CHANNEL_CLASSES.referral
      if (v.includes('social')) return CHANNEL_CLASSES.social
      return CHANNEL_CLASSES.other
    },

    // Debug helper - call this from console if needed
    debugSourceData() {
      if (this.sourceData.length > 0) {
        const first = this.sourceData[0]
        console.log('First source item:', first)
        console.log('Calculated conversion rate:', 
          first.conversions && first.sessions ? 
          (first.conversions / first.sessions * 100).toFixed(2) + '%' : 'N/A')
        console.log('Provided conversion rate:', first.sessionConversionRate)
      }
    }
  },

  mounted() {
    // Log source data for debugging
    if (this.sourceData.length > 0) {
      console.log('Source data sample:', {
        first: this.sourceData[0],
        calculatedRate: this.sourceData[0].conversions && this.sourceData[0].sessions ?
          (this.sourceData[0].conversions / this.sourceData[0].sessions * 100).toFixed(2) + '%' : 'N/A'
      })
    }
  }
}
</script>

<style scoped>
.loading-state {
  padding: var(--space-8);
  text-align: center;
  color: var(--gray-500);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
}

.tables-section { background: #fff; border-radius: var(--radius-2xl); padding: var(--space-6); box-shadow: var(--shadow-md); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); cursor: pointer; }
.section-header h2 { font-size: 1.25rem; font-weight: 600; color: var(--gray-800); }
.expand-icon { color: var(--gray-500); }
.tables-stack { display: flex; flex-direction: column; gap: var(--space-6); margin-top: var(--space-6); }
.table-card { background: var(--gray-50); padding: var(--space-6); border-radius: var(--radius-xl); width: 100%; }
.table-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-6); }
.table-header h3 { font-size: 1rem; font-weight: 600; color: var(--gray-700); }
.table-tabs { display: flex; gap: var(--space-2); background: #fff; padding: var(--space-1); border-radius: var(--radius-lg); }
.table-tabs button { padding: var(--space-2) var(--space-4); border: none; background: transparent; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 500; color: var(--gray-500); cursor: pointer; transition: all 0.2s; }
.table-tabs button.active { background: var(--primary); color: #fff; }
.table-wrapper { overflow: auto; max-height: 500px; border-radius: var(--radius-lg); scrollbar-width: thin; scrollbar-color: var(--gray-300) var(--gray-100); }
.table-wrapper::-webkit-scrollbar { width: 8px; height: 8px; }
.table-wrapper::-webkit-scrollbar-track { background: var(--gray-100); border-radius: var(--radius-sm); }
.table-wrapper::-webkit-scrollbar-thumb { background: var(--gray-300); border-radius: var(--radius-sm); }
.table-wrapper::-webkit-scrollbar-thumb:hover { background: var(--gray-400); }
.data-table { width: 100%; min-width: 1000px; border-collapse: collapse; table-layout: fixed; font-size: 0.875rem; background: #fff; }
.data-table th { padding: var(--space-3) var(--space-2); text-align: center; vertical-align: middle; white-space: nowrap; }
.data-table .main-headers th { background: var(--gray-100); color: var(--gray-700); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; border-bottom: 2px solid var(--gray-300); }
.data-table td { padding: var(--space-3) var(--space-2); border-bottom: 1px solid var(--gray-200); color: var(--gray-800); vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right; }
.data-table td:first-child, .data-table td:nth-child(2), .data-table .campaign-cell { text-align: left; }
.data-table tbody tr:hover td { background: var(--gray-50); }
.data-table tbody tr:nth-child(even) { background-color: #fafafa; }
.campaign-cell { white-space: normal; word-break: break-word; max-width: 200px; color: var(--gray-600); cursor: pointer; display: flex; align-items: center; gap: 4px; }
.campaign-cell:hover { text-decoration: underline; }
.toggle-icon { font-weight: 700; color: var(--gray-500); margin-left: 4px; }
.channel-badge, .device-badge { display: inline-block; padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.channel-badge.organic { background: #dbeafe; color: #1e40af; }
.channel-badge.paid { background: #fee2e2; color: #991b1b; }
.channel-badge.direct { background: #dcfce7; color: #166534; }
.channel-badge.referral { background: #fef3c7; color: #92400e; }
.channel-badge.social { background: #f3e8ff; color: #6b21a8; }
.channel-badge.other { background: var(--gray-100); color: var(--gray-600); }
.device-badge { background: var(--gray-100); color: var(--gray-600); max-width: 80px; }
.period-badge { font-size: 0.7rem; font-weight: normal; background: var(--gray-200); color: var(--gray-600); padding: 2px 6px; border-radius: var(--radius-full); margin-left: 8px; display: inline-block; vertical-align: middle; }
.main-value { background-color: #f8fafc; border-right: 1px solid var(--gray-200); }
.comparison-value { background-color: #f0f9ff; color: var(--gray-600); }
.comparison-value .positive { color: var(--success); font-weight: 600; }
.comparison-value .negative { color: var(--danger); font-weight: 600; }
.comparison-value .neutral { color: var(--gray-600); }
.data-table td.main-value, .data-table td.comparison-value { min-width: 100px; }
.empty { text-align: center; color: var(--gray-500); padding: var(--space-6) !important; }
@media (max-width: 1024px) {
  .data-table { font-size: 0.8rem; }
  .data-table th, .data-table td { padding: var(--space-2) var(--space-1); }
}
</style>