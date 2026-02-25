<template>
  <div class="dashboard">
    <!-- Header with gradient background -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Conversion Intelligence</h1>
        <p class="subtitle">Track sales, understand why conversions change, and see where those changes happen geographically</p>
      </div>
      
      <!-- Date Range Selector with Calendars -->
      <div class="date-range-card">
        <div class="date-inputs">
          <div class="input-group">
            <label>Start Date</label>
            <div class="date-input-wrapper">
              <input 
                type="date" 
                v-model="dateRange.startDate" 
                :max="dateRange.endDate"
                class="date-picker"
              />
              <span class="material-symbols-outlined date-icon">calendar_today</span>
            </div>
          </div>
          <div class="input-group">
            <label>End Date</label>
            <div class="date-input-wrapper">
              <input 
                type="date" 
                v-model="dateRange.endDate" 
                :min="dateRange.startDate"
                :max="today"
                class="date-picker"
              />
              <span class="material-symbols-outlined date-icon">calendar_today</span>
            </div>
          </div>
          <div class="input-group quick-select">
            <label>Quick Select</label>
            <select v-model="selectedQuickRange" @change="applyQuickRange" class="quick-select-dropdown">
              <option value="">Custom Range</option>
              <option value="7daysAgo">Last 7 Days</option>
              <option value="30daysAgo">Last 30 Days</option>
              <option value="90daysAgo">Last 90 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
        </div>
        <div class="action-buttons">
          <button @click="exportToCSV" :disabled="loading || !hasData" class="export-btn">
            <span class="material-symbols-outlined">download</span>
            Export CSV
          </button>
          <button @click="fetchAllData" :disabled="loading" class="update-btn">
            <span v-if="!loading">Update Dashboard</span>
            <span v-else class="loading-spinner"></span>
          </button>
        </div>
      </div>
    </header>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <div class="skeleton-header"></div>
        <div class="skeleton-chart"></div>
      </div>
    </div>

    <div v-else class="dashboard-content">
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" v-for="kpi in kpiData" :key="kpi.label">
          <div class="kpi-icon" :style="{ backgroundColor: kpi.color + '20' }">
            <span class="material-symbols-outlined" :style="{ color: kpi.color }">{{ kpi.icon }}</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">{{ kpi.label }}</span>
            <span class="kpi-value">{{ kpi.value }}</span>
            <span class="kpi-trend" :class="kpi.trend > 0 ? 'positive' : 'negative'">
              {{ kpi.trend > 0 ? '↑' : '↓' }} {{ Math.abs(kpi.trend) }}% vs last period
            </span>
          </div>
        </div>
      </div>

      <!-- Interactive Map -->
      <div class="map-section">
        <div class="section-header">
          <h2>Geographic Performance - South Africa</h2>
          <div class="map-controls">
            <select v-model="mapMetric" class="map-select">
              <option value="revenue">Revenue (ZAR)</option>
              <option value="transactions">Transactions</option>
              <option value="sessions">Sessions</option>
              <option value="conversionRate">Conversion Rate</option>
              <option value="conversions">Conversions</option>
            </select>
            <div class="map-legend">
              <span class="legend-item low">Low</span>
              <span class="legend-item medium">Medium</span>
              <span class="legend-item high">High</span>
            </div>
          </div>
        </div>
        
        <div class="map-container">
          <div ref="mapElement" class="leaflet-map"></div>
          
          <!-- City markers panel -->
          <div class="city-markers-panel" v-if="saCities.length > 0">
            <h4>Top Cities</h4>
            <div class="city-list">
              <div 
                v-for="city in saCities.slice(0, 5)" 
                :key="city.name"
                class="city-marker-item"
                @mouseenter="highlightCity(city)"
                @mouseleave="resetHighlight"
                @click="zoomToCity(city)"
              >
                <span class="city-dot" :style="{ backgroundColor: getCityColor(city) }"></span>
                <span class="city-name">{{ city.name }}</span>
                <span class="city-value">{{ formatCityValue(city) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Revenue by Location -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Revenue by Location (ZAR)</h3>
            <select v-model="revenueChartMetric" class="chart-select">
              <option value="revenue">Revenue (ZAR)</option>
              <option value="transactions">Transactions</option>
            </select>
          </div>
          <div class="chart-container">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>

        <!-- Sessions by Location -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Sessions & Users by Location</h3>
            <select v-model="sessionChartMetric" class="chart-select">
              <option value="sessions">Sessions</option>
              <option value="activeUsers">Active Users</option>
              <option value="newUsers">New Users</option>
            </select>
          </div>
          <div class="chart-container">
            <canvas ref="sessionChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Detailed Data Tables -->
      <div class="tables-section">
        <div class="section-header" @click="showTables = !showTables">
          <h2>Detailed Data</h2>
          <span class="material-symbols-outlined expand-icon">
            {{ showTables ? 'expand_less' : 'expand_more' }}
          </span>
        </div>
        
        <div v-if="showTables" class="tables-grid">
          <!-- Location Performance Table -->
          <div class="table-card">
            <div class="table-header">
              <h3>Location Performance Details</h3>
              <div class="table-tabs">
                <button 
                  :class="{ active: activeLocationTab === 'session' }" 
                  @click="activeLocationTab = 'session'"
                >
                  Sessions & Users
                </button>
                <button 
                  :class="{ active: activeLocationTab === 'revenue' }" 
                  @click="activeLocationTab = 'revenue'"
                >
                  Revenue (ZAR)
                </button>
              </div>
            </div>
            
            <div class="table-wrapper">
              <table v-if="activeLocationTab === 'session'">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Country</th>
                    <th>Sessions</th>
                    <th>Conversions</th>
                    <th>Conv. Rate</th>
                    <th>Active Users</th>
                    <th>New Users</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in locationSessionData.slice(0, 10)" :key="idx">
                    <td>{{ item.city || '—' }}</td>
                    <td>{{ item.country || '—' }}</td>
                    <td>{{ formatNumber(item.sessions) }}</td>
                    <td>{{ formatNumber(calculateConversions(item.sessions, item.sessionConversionRate)) }}</td>
                    <td>{{ formatPercent(item.sessionConversionRate) }}</td>
                    <td>{{ formatNumber(item.activeUsers) }}</td>
                    <td>{{ formatNumber(item.newUsers) }}</td>
                  </tr>
                </tbody>
              </table>
              
              <table v-else>
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Country</th>
                    <th>Revenue (ZAR)</th>
                    <th>Transactions</th>
                    <th>Avg. Order Value (ZAR)</th>
                    <th>Est. Conversions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in locationRevenueData.slice(0, 10)" :key="idx">
                    <td>{{ item.city || '—' }}</td>
                    <td>{{ item.country || '—' }}</td>
                    <td>{{ formatZAR(item.purchaseRevenue) }}</td>
                    <td>{{ formatNumber(item.transactions) }}</td>
                    <td>{{ formatZAR(item.transactions ? item.purchaseRevenue / item.transactions : 0) }}</td>
                    <td>{{ formatNumber(estimateConversions(item)) }}</td>
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
              <table>
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Device</th>
                    <th>Campaign</th>
                    <th>Sessions</th>
                    <th>Conversions</th>
                    <th>Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in sourceData.slice(0, 8)" :key="idx">
                    <td>
                      <span class="channel-badge" :class="getChannelClass(item.channel)">
                        {{ item.channel || 'Other' }}
                      </span>
                    </td>
                    <td><span class="device-badge">{{ item.deviceCategory || '—' }}</span></td>
                    <td>{{ truncateString(item.campaignName, 20) || '—' }}</td>
                    <td>{{ formatNumber(item.sessions) }}</td>
                    <td>{{ formatNumber(calculateConversions(item.sessions, item.sessionConversionRate)) }}</td>
                    <td>{{ formatPercent(item.sessionConversionRate) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch, computed, onBeforeUnmount, nextTick } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'Dashboard',
  setup() {
    // ==================== STATE ====================
    const today = new Date().toISOString().split('T')[0]
    const dateRange = reactive({ 
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: today
    })
    const selectedQuickRange = ref('')
    const loading = ref(true)
    const showTables = ref(false)
    const activeLocationTab = ref('session')
    const revenueChartMetric = ref('revenue')
    const sessionChartMetric = ref('sessions')
    const mapMetric = ref('revenue')

    // Data containers
    const locationSessionData = ref([])
    const locationRevenueData = ref([])
    const sourceData = ref([])

    // Map refs
    const mapElement = ref(null)
    let map = null
    let markers = []
    let highlightedMarker = null
    let L = null

    // Chart refs
    const revenueChart = ref(null)
    const sessionChart = ref(null)

    // Chart instances
    let revenueChartInstance = null
    let sessionChartInstance = null

const config = useRuntimeConfig()
const API_BASE = config.public.apiBase


    // ==================== CONSTANTS ====================
    const CITY_COORDINATES = {
      'johannesburg': { lat: -26.2041, lng: 28.0473, name: 'Johannesburg' },
      'cape town': { lat: -33.9249, lng: 18.4241, name: 'Cape Town' },
      'durban': { lat: -29.8587, lng: 31.0218, name: 'Durban' },
      'pretoria': { lat: -25.7479, lng: 28.2293, name: 'Pretoria' },
      'port elizabeth': { lat: -33.9608, lng: 25.6022, name: 'Port Elizabeth' },
      'bloemfontein': { lat: -29.0852, lng: 26.1596, name: 'Bloemfontein' },
      'east london': { lat: -33.0153, lng: 27.9116, name: 'East London' },
      'polokwane': { lat: -23.8962, lng: 29.4486, name: 'Polokwane' },
      'nelspruit': { lat: -25.4745, lng: 30.9703, name: 'Mbombela' },
      'kimberley': { lat: -28.7282, lng: 24.7499, name: 'Kimberley' },
      'upington': { lat: -28.4478, lng: 21.2561, name: 'Upington' },
      'george': { lat: -33.9881, lng: 22.4529, name: 'George' }
    }

    // ==================== UTILITIES ====================
    const formatters = {
      zar: (value) => new Intl.NumberFormat('en-ZA', { 
        style: 'currency', 
        currency: 'ZAR', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value),
      number: (value) => new Intl.NumberFormat('en-ZA').format(value),
      percent: (value) => new Intl.NumberFormat('en-ZA', { 
        style: 'percent', 
        minimumFractionDigits: 1 
      }).format(value / 100),
      truncate: (str, maxLength) => !str ? str : str.length > maxLength ? str.substring(0, maxLength) + '...' : str
    }

    function getChannelClass(channel) {
      if (!channel) return 'other'
      const channelLower = channel.toLowerCase()
      if (channelLower.includes('organic')) return 'organic'
      if (channelLower.includes('paid')) return 'paid'
      if (channelLower.includes('direct')) return 'direct'
      if (channelLower.includes('referral')) return 'referral'
      if (channelLower.includes('social')) return 'social'
      return 'other'
    }

    // ==================== CONVERSION CALCULATIONS ====================
    function calculateConversions(sessions, conversionRate) {
      return Math.round(sessions * (conversionRate / 100))
    }

    function estimateConversions(revenueItem) {
      // Find matching session data for the same city to estimate conversions
      const sessionItem = locationSessionData.value.find(s => s.city === revenueItem.city)
      if (sessionItem) {
        return calculateConversions(sessionItem.sessions, sessionItem.sessionConversionRate)
      }
      return 0
    }

    // ==================== COMPUTED ====================
    const saCities = computed(() => {
      return locationRevenueData.value
        .filter(item => item.country?.toLowerCase().includes('south africa') || 
                        Object.keys(CITY_COORDINATES).some(city => item.city?.toLowerCase().includes(city)))
        .map(item => {
          const cityKey = Object.keys(CITY_COORDINATES).find(city => item.city?.toLowerCase().includes(city))
          const coords = cityKey ? CITY_COORDINATES[cityKey] : null
          const sessionData = locationSessionData.value.find(s => s.city === item.city)
          const sessions = sessionData?.sessions || 0
          const conversionRate = sessionData?.sessionConversionRate || 0
          
          return {
            name: item.city || 'Unknown',
            lat: coords?.lat || null,
            lng: coords?.lng || null,
            revenue: item.purchaseRevenue || 0,
            transactions: item.transactions || 0,
            sessions: sessions,
            conversionRate: conversionRate,
            conversions: calculateConversions(sessions, conversionRate)
          }
        })
        .filter(city => city.lat && city.lng)
    })

    const kpiData = computed(() => {
      const totalRevenue = locationRevenueData.value.reduce((sum, item) => sum + item.purchaseRevenue, 0)
      const totalTransactions = locationRevenueData.value.reduce((sum, item) => sum + item.transactions, 0)
      const totalSessions = locationSessionData.value.reduce((sum, item) => sum + item.sessions, 0)
      const totalConversions = locationSessionData.value.reduce((sum, item) => 
        sum + calculateConversions(item.sessions, item.sessionConversionRate), 0)
      const avgConversionRate = locationSessionData.value.length > 0 
        ? locationSessionData.value.reduce((sum, item) => sum + item.sessionConversionRate, 0) / locationSessionData.value.length
        : 0
      
      return [
        { label: 'Total Revenue', value: formatters.zar(totalRevenue), trend: 12.5, icon: 'trending_up', color: '#10b981' },
        { label: 'Transactions', value: formatters.number(totalTransactions), trend: 8.2, icon: 'shopping_cart', color: '#3b82f6' },
        { label: 'Sessions', value: formatters.number(totalSessions), trend: -3.1, icon: 'visibility', color: '#f59e0b' },
        { label: 'Conversions', value: formatters.number(totalConversions), trend: 7.2, icon: 'conversion_path', color: '#8b5cf6' },
        { label: 'Avg. Conv. Rate', value: formatters.percent(avgConversionRate), trend: 5.7, icon: 'percent', color: '#ec4899' }
      ]
    })

    const hasData = computed(() => {
      return locationSessionData.value.length > 0 || locationRevenueData.value.length > 0 || sourceData.value.length > 0
    })

    // ==================== API FUNCTIONS ====================
    function formatDateForAPI(date) {
      // Convert YYYY-MM-DD to format like '2024-01-15' (GA4 accepts this format)
      return date
    }

    async function fetchData(endpoint) {
      const url = new URL(`${API_BASE}${endpoint}`)
      url.searchParams.append('startDate', formatDateForAPI(dateRange.startDate))
      url.searchParams.append('endDate', formatDateForAPI(dateRange.endDate))
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Fetch failed: ${endpoint}`)
      return await res.json()
    }

    async function fetchAllData() {
      loading.value = true
      try {
        const [sessionData, revenueData, source] = await Promise.all([
          fetchData('/analytics/conversions-by-location'),
          fetchData('/analytics/revenue-by-location'),
          fetchData('/analytics/conversions-by-source')
        ])
        
        locationSessionData.value = sessionData
        locationRevenueData.value = revenueData
        sourceData.value = source
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        loading.value = false
        await nextTick()
        updateRevenueChart()
        updateSessionChart()
        
        // 🔥 FIX: Destroy old map and create fresh one
        if (map) {
          map.remove()
          map = null
          markers = []
          highlightedMarker = null
        }
        initMap()
      }
    }

    // ==================== QUICK RANGE FUNCTIONS ====================
    function applyQuickRange() {
      const end = new Date()
      let start = new Date()
      
      switch(selectedQuickRange.value) {
        case '7daysAgo':
          start.setDate(end.getDate() - 7)
          break
        case '30daysAgo':
          start.setDate(end.getDate() - 30)
          break
        case '90daysAgo':
          start.setDate(end.getDate() - 90)
          break
        case 'thisMonth':
          start = new Date(end.getFullYear(), end.getMonth(), 1)
          break
        case 'lastMonth':
          start = new Date(end.getFullYear(), end.getMonth() - 1, 1)
          end.setDate(0) // Last day of previous month
          break
        case 'thisYear':
          start = new Date(end.getFullYear(), 0, 1)
          break
        default:
          return
      }
      
      dateRange.startDate = start.toISOString().split('T')[0]
      dateRange.endDate = end.toISOString().split('T')[0]
      fetchAllData()
    }

    // ==================== EXPORT FUNCTIONS ====================
    function exportToCSV() {
      const data = []
      
      // Add headers
      data.push(['Location Performance Report'])
      data.push([`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`])
      data.push([])
      
      // Session data
      data.push(['Sessions & Users by Location'])
      data.push(['City', 'Country', 'Sessions', 'Conversions', 'Conversion Rate', 'Active Users', 'New Users'])
      locationSessionData.value.forEach(item => {
        data.push([
          item.city || '—',
          item.country || '—',
          item.sessions,
          calculateConversions(item.sessions, item.sessionConversionRate),
          (item.sessionConversionRate / 100).toFixed(3),
          item.activeUsers,
          item.newUsers
        ])
      })
      
      data.push([])
      
      // Revenue data
      data.push(['Revenue by Location (ZAR)'])
      data.push(['City', 'Country', 'Revenue (ZAR)', 'Transactions', 'Avg Order Value (ZAR)'])
      locationRevenueData.value.forEach(item => {
        data.push([
          item.city || '—',
          item.country || '—',
          item.purchaseRevenue,
          item.transactions,
          item.transactions ? (item.purchaseRevenue / item.transactions).toFixed(2) : 0
        ])
      })
      
      data.push([])
      
      // Source data
      data.push(['Source Analysis'])
      data.push(['Channel', 'Device', 'Campaign', 'Sessions', 'Conversions', 'Conversion Rate'])
      sourceData.value.forEach(item => {
        data.push([
          item.channel || 'Other',
          item.deviceCategory || '—',
          item.campaignName || '—',
          item.sessions,
          calculateConversions(item.sessions, item.sessionConversionRate),
          (item.sessionConversionRate / 100).toFixed(3)
        ])
      })
      
      // Convert to CSV
      const csvContent = data.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `analytics_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    // ==================== MAP FUNCTIONS ====================
    async function initMap() {
      if (!mapElement.value) return
      
      try {
        const leaflet = await import('leaflet')
        L = leaflet.default || leaflet
        
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })
        
        map = L.map(mapElement.value).setView([-28.5, 24.5], 5)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map)
        
        map.whenReady(() => setTimeout(() => map.invalidateSize(), 100))
        updateMapMarkers()
      } catch (error) {
        console.error('Failed to load map:', error)
      }
    }

    function getCityMetricValue(city) {
      const metricMap = { 
        revenue: city.revenue, 
        transactions: city.transactions, 
        sessions: city.sessions, 
        conversionRate: city.conversionRate,
        conversions: city.conversions
      }
      return metricMap[mapMetric.value] || city.revenue
    }

    function getMetricColor(value, maxValue) {
      const normalized = value / maxValue
      if (normalized > 0.66) return '#ef4444'
      if (normalized > 0.33) return '#f59e0b'
      return '#10b981'
    }

    function updateMapMarkers() {
      if (!map || !L || !saCities.value.length) return
      
      markers.forEach(marker => map.removeLayer(marker))
      markers = []
      
      const values = saCities.value.map(getCityMetricValue)
      const maxValue = Math.max(...values, 1)
      
      saCities.value.forEach(city => {
        const value = getCityMetricValue(city)
        const color = getMetricColor(value, maxValue)
        const radius = 8 + (12 * (value / maxValue))
        
        const circle = L.circleMarker([city.lat, city.lng], {
          radius, fillColor: color, color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 0.8
        })
        
        circle.bindPopup(`
          <div class="map-popup">
            <strong>${city.name}</strong><br>
            Revenue: ${formatters.zar(city.revenue)}<br>
            Transactions: ${formatters.number(city.transactions)}<br>
            Sessions: ${formatters.number(city.sessions)}<br>
            Conversions: ${formatters.number(city.conversions)}<br>
            Conv. Rate: ${formatters.percent(city.conversionRate)}
          </div>
        `)
        
        circle.addTo(map)
        markers.push(circle)
      })
    }

    function getCityColor(city) {
      const values = saCities.value.map(getCityMetricValue)
      const maxValue = Math.max(...values, 1)
      return getMetricColor(getCityMetricValue(city), maxValue)
    }

    function formatCityValue(city) {
      const value = getCityMetricValue(city)
      const formatMap = {
        revenue: formatters.zar,
        transactions: formatters.number,
        sessions: formatters.number,
        conversionRate: formatters.percent,
        conversions: formatters.number
      }
      return formatMap[mapMetric.value]?.(value) || formatters.zar(value)
    }

    function highlightCity(city) {
      if (!map || !L) return
      
      if (highlightedMarker) highlightedMarker.setStyle({ weight: 2, color: '#ffffff' })
      
      const marker = markers.find(m => {
        const latLng = m.getLatLng()
        return Math.abs(latLng.lat - city.lat) < 0.01 && Math.abs(latLng.lng - city.lng) < 0.01
      })
      
      if (marker) {
        marker.setStyle({ weight: 4, color: '#000000' })
        highlightedMarker = marker
        marker.openPopup()
      }
    }

    function resetHighlight() {
      if (highlightedMarker) {
        highlightedMarker.setStyle({ weight: 2, color: '#ffffff' })
        highlightedMarker.closePopup()
        highlightedMarker = null
      }
    }

    function zoomToCity(city) {
      if (!map) return
      map.setView([city.lat, city.lng], 10)
      highlightCity(city)
    }

    // ==================== CHART FUNCTIONS ====================
    function createChartConfig(type, labels, data, label, color, formatter) {
      return {
        type: 'bar',
        data: { labels, datasets: [{ label, data, backgroundColor: color, borderRadius: 8 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatter ? formatter(ctx.parsed.y) : ctx.parsed.y}` }
            }
          },
          scales: {
            y: { 
              beginAtZero: true, 
              grid: { color: '#e5e7eb' },
              ticks: {
                callback: (value) => formatter ? formatter(value) : value
              }
            },
            x: { grid: { display: false } }
          }
        }
      }
    }

    function updateRevenueChart() {
      if (!revenueChart.value || !locationRevenueData.value.length) return
      if (revenueChartInstance) revenueChartInstance.destroy()
      
      const topLocations = locationRevenueData.value.slice(0, 8)
      const isRevenue = revenueChartMetric.value === 'revenue'
      
      revenueChartInstance = new Chart(revenueChart.value, createChartConfig(
        'bar',
        topLocations.map(item => item.city || 'Unknown'),
        topLocations.map(item => isRevenue ? item.purchaseRevenue : item.transactions),
        isRevenue ? 'Revenue (ZAR)' : 'Transactions',
        'rgba(59, 130, 246, 0.8)',
        isRevenue ? formatters.zar : formatters.number
      ))
    }

    function updateSessionChart() {
      if (!sessionChart.value || !locationSessionData.value.length) return
      if (sessionChartInstance) sessionChartInstance.destroy()
      
      const topLocations = locationSessionData.value.slice(0, 8)
      const metricLabels = { sessions: 'Sessions', activeUsers: 'Active Users', newUsers: 'New Users' }
      const label = metricLabels[sessionChartMetric.value] || 'Sessions'
      
      sessionChartInstance = new Chart(sessionChart.value, createChartConfig(
        'bar',
        topLocations.map(item => item.city || 'Unknown'),
        topLocations.map(item => item[sessionChartMetric.value]),
        label,
        'rgba(16, 185, 129, 0.8)',
        formatters.number
      ))
    }

    // ==================== WATCHERS ====================
    watch(revenueChartMetric, () => !loading.value && locationRevenueData.value.length && nextTick(updateRevenueChart))
    watch(sessionChartMetric, () => !loading.value && locationSessionData.value.length && nextTick(updateSessionChart))
    watch(locationRevenueData, () => !loading.value && locationRevenueData.value.length && nextTick(updateRevenueChart), { deep: true })
    watch(locationSessionData, () => !loading.value && locationSessionData.value.length && nextTick(updateSessionChart), { deep: true })
    watch([mapMetric, saCities], () => !loading.value && map && updateMapMarkers(), { deep: true })

    // ==================== LIFECYCLE ====================
    onMounted(fetchAllData)
    onBeforeUnmount(() => {
      if (map) {
        map.remove()
        map = null
      }
      if (revenueChartInstance) {
        revenueChartInstance.destroy()
        revenueChartInstance = null
      }
      if (sessionChartInstance) {
        sessionChartInstance.destroy()
        sessionChartInstance = null
      }
    })

    // ==================== RETURN ====================
    return {
      today,
      dateRange, 
      selectedQuickRange,
      loading, 
      showTables, 
      activeLocationTab, 
      revenueChartMetric, 
      sessionChartMetric, 
      mapMetric,
      locationSessionData, 
      locationRevenueData, 
      sourceData, 
      mapElement, 
      revenueChart, 
      sessionChart,
      saCities, 
      kpiData,
      hasData,
      fetchAllData,
      applyQuickRange,
      exportToCSV,
      calculateConversions,
      estimateConversions,
      formatZAR: formatters.zar,
      formatNumber: formatters.number, 
      formatPercent: formatters.percent,
      truncateString: formatters.truncate, 
      getChannelClass, 
      highlightCity, 
      resetHighlight, 
      zoomToCity,
      getCityColor, 
      formatCityValue
    }
  }
}
</script>

<style>
/* Import Leaflet CSS */
@import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0,1');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dashboard {
  font-family: 'Inter', sans-serif;
  background: #f3f4f6;
  min-height: 100vh;
  color: #1f2937;
}

/* Header Styles */
.dashboard-header {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  padding: 2rem 2rem 3rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #94a3b8;
  font-size: 1rem;
}

/* Date Range Card */
.date-range-card {
  max-width: 1400px;
  margin: 1.5rem auto 0;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.date-inputs {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  flex: 1;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 160px;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-picker {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  width: 100%;
  transition: border-color 0.2s;
  font-family: 'Inter', sans-serif;
}

.date-picker:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-icon {
  position: absolute;
  left: 0.75rem;
  color: #9ca3af;
  font-size: 1.25rem;
  pointer-events: none;
}

.quick-select {
  min-width: 140px;
}

.quick-select-dropdown {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  width: 100%;
  background: white;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}

.quick-select-dropdown:focus {
  outline: none;
  border-color: #3b82f6;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.export-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 42px;
}

.export-btn:hover:not(:disabled) {
  background: #059669;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.update-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 160px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.update-btn:hover:not(:disabled) {
  background: #2563eb;
}

.update-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading Spinner */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Dashboard Content */
.dashboard-content {
  max-width: 1400px;
  margin: -1.5rem auto 2rem;
  padding: 0 2rem;
  position: relative;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon .material-symbols-outlined {
  font-size: 24px;
}

.kpi-info {
  flex: 1;
}

.kpi-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.kpi-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.kpi-trend {
  font-size: 0.75rem;
  font-weight: 500;
}

.kpi-trend.positive {
  color: #10b981;
}

.kpi-trend.negative {
  color: #ef4444;
}

/* Map Section */
.map-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  cursor: pointer;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.map-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.map-select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #4b5563;
  background: white;
  cursor: pointer;
}

.map-legend {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
}

.legend-item {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: white;
}

.legend-item.low { background: #10b981; }
.legend-item.medium { background: #f59e0b; }
.legend-item.high { background: #ef4444; }

.map-container {
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 1rem;
  height: 450px;
}

.leaflet-map {
  height: 100%;
  width: 100%;
  border-radius: 12px;
  z-index: 1;
  background: #f8fafc;
}

.city-markers-panel {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
  overflow-y: auto;
}

.city-markers-panel h4 {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.city-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.city-marker-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.city-marker-item:hover {
  border-color: #3b82f6;
  transform: translateX(4px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.city-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.city-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.city-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
}

/* Map Popup */
.map-popup {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  line-height: 1.5;
  min-width: 150px;
}

.map-popup strong {
  color: #1f2937;
  display: block;
  margin-bottom: 0.25rem;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.chart-select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #4b5563;
  background: white;
  cursor: pointer;
}

.chart-container {
  height: 300px;
  position: relative;
}

/* Tables Section */
.tables-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.expand-icon {
  color: #6b7280;
}

.tables-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.table-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.table-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.table-tabs {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.25rem;
  border-radius: 8px;
}

.table-tabs button {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.table-tabs button.active {
  background: #3b82f6;
  color: white;
}

.table-wrapper {
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th {
  text-align: left;
  padding: 0.75rem 0.5rem;
  background: white;
  color: #4b5563;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  z-index: 10;
}

td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}

tr:hover td {
  background: white;
}

/* Badges */
.channel-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.channel-badge.organic { background: #dbeafe; color: #1e40af; }
.channel-badge.paid { background: #fee2e2; color: #991b1b; }
.channel-badge.direct { background: #dcfce7; color: #166534; }
.channel-badge.referral { background: #fef3c7; color: #92400e; }
.channel-badge.social { background: #f3e8ff; color: #6b21a8; }
.channel-badge.other { background: #f3f4f6; color: #4b5563; }

.device-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #4b5563;
}

/* Loading Skeleton */
.loading-skeleton {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.skeleton-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.skeleton-header {
  height: 24px;
  width: 200px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.skeleton-chart {
  height: 300px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .charts-grid,
  .tables-grid {
    grid-template-columns: 1fr;
  }
  
  .map-container {
    grid-template-columns: 1fr;
  }
  
  .city-markers-panel {
    max-height: 200px;
  }
  
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1.5rem 1.5rem 2.5rem;
  }
  
  .dashboard-content {
    padding: 0 1rem;
  }
  
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  
  .date-range-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-inputs {
    flex-direction: column;
  }
  
  .input-group {
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .export-btn,
  .update-btn {
    width: 100%;
  }
  
  .map-controls {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>