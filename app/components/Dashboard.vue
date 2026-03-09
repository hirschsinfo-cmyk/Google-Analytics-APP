<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Hirsch's Conversion Intelligence</h1>
        <p class="subtitle">
          Track sales, understand why conversions change, and see where those changes happen geographically
        </p>
      </div>
      
      <!-- Date Range Selector Component -->
      <DateRangeSelector
        v-model:startDate="dateRange.startDate"
        v-model:endDate="dateRange.endDate"
        v-model:comparisonStart="comparisonRange.startDate"
        v-model:comparisonEnd="comparisonRange.endDate"
        v-model:enableComparison="enableComparison"
        v-model:quickRange="selectedQuickRange"
        :loading="loading"
        :hasData="hasData"
        @update="fetchAllData"
        @export="exportToCSV"
        @quickRangeChange="applyQuickRange"
      />
    </header>

    <!-- SKU Counter Component -->
    <TotalAvailableProds />

    <!-- Loading Skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-header"></div>
        <div class="skeleton-chart"></div>
      </div>
    </div>

    <div v-else class="dashboard-content">
      <!-- KPI Grid Component -->
      <KPIGrid
        :kpiData="kpiData"
        :enableComparison="enableComparison"
        :expandedKPI="expandedKPI"
        @toggleExpand="toggleExpandKPI"
      />

      <!-- Customer Type Component -->
      <CustomerType :engagementData="engagementData" />

      <!-- Performance Drivers Component -->
      <PerformanceDrivers
        :sessionData="locationSessionData"
        :sessionComparison="locationSessionComparison"
        :basketData="basketSizeData"
        :basketComparison="basketSizeComparison"
        :engagementData="engagementData"
      />

      <!-- Engagement Section Component -->
      <EngagementSection
        :engagementData="engagementData"
        :enableComparison="enableComparison"
        :expandedEngagement="expandedEngagement"
        @toggleExpand="toggleExpandEngagement"
      />

      <!-- Event Breakdown Component (NEW) -->
      <EventBreakdown
        :events="eventData"
        :loading="loading"
        :itemsPerPage="12"
      />

      <!-- Page Hotspots Component -->
      <PageHotspots
        :pageHotspots="pageHotspots"
        :topPages="topPages"
        :enableComparison="enableComparison"
        :showHotspots="showHotspots"
        :expandedPage="expandedPage"
        @toggleSection="showHotspots = !showHotspots"
        @toggleExpand="toggleExpandPage"
      />

      <!-- SKU Analysis Component -->
      <SKUAnalysis :basketData="basketSizeData" />

      <!-- Basket Analysis Component -->
      <BasketAnalysis
        :basketSizeData="basketSizeData"
        :enableComparison="enableComparison"
        :expandedBasket="expandedBasket"
        @toggleExpand="toggleExpandBasket"
      />

      <!-- Promo Analysis Component -->
      <PromoAnalysis
        :sourceData="sourceData"
        :sessionData="locationSessionData"
        :basketData="basketSizeData"
      />

      <!-- Geographic Map Component -->
      <GeographicMap
        :saCities="saCities"
        :enableComparison="enableComparison"
        :mapMetric="mapMetric"
        :mapView="mapView"
        :expandedCity="expandedCity"
        @update:mapMetric="mapMetric = $event"
        @update:mapView="mapView = $event"
        @toggleExpand="toggleExpandCity"
        @highlightCity="highlightCity"
        @resetHighlight="resetHighlight"
      />

      <!-- Charts Section Component -->
      <ChartsSection
        :locationRevenueData="locationRevenueData"
        :locationRevenueComparison="locationRevenueComparison"
        :locationSessionData="locationSessionData"
        :locationSessionComparison="locationSessionComparison"
        :enableComparison="enableComparison"
        :revenueChartMetric="revenueChartMetric"
        :sessionChartMetric="sessionChartMetric"
        :revenueChartView="revenueChartView"
        :sessionChartView="sessionChartView"
        @update:revenueChartMetric="revenueChartMetric = $event"
        @update:sessionChartMetric="sessionChartMetric = $event"
        @update:revenueChartView="revenueChartView = $event"
        @update:sessionChartView="sessionChartView = $event"
      />

      <!-- Data Tables Component -->
      <DataTables
        :locationSessionData="locationSessionData"
        :locationRevenueData="locationRevenueData"
        :sourceData="sourceData"
        :enableComparison="enableComparison"
        :activeLocationTab="activeLocationTab"
        :showTables="showTables"
        @update:activeLocationTab="activeLocationTab = $event"
        @toggleTables="showTables = !showTables"
      />
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch, computed, onBeforeUnmount, nextTick } from 'vue'
import DateRangeSelector from './DateRangeSelector.vue'
import KPIGrid from './KPIGrid.vue'
import CustomerType from './CustomerType.vue'
import PerformanceDrivers from './PerformanceDrivers.vue'
import EngagementSection from './EngagementSection.vue'
import PageHotspots from './PageHotspots.vue'
import SKUAnalysis from './SKUAnalysis.vue'
import BasketAnalysis from './BasketAnalysis.vue'
import PromoAnalysis from './PromoAnalysis.vue'
import GeographicMap from './GeographicMap.vue'
import ChartsSection from './ChartsSection.vue'
import DataTables from './DataTables.vue'
import TotalAvailableProds from './TotalAvailableProds.vue'
import EventBreakdown from './EventBreakdown.vue' // NEW IMPORT

export default {
  name: 'Dashboard',
  components: {
    DateRangeSelector,
    KPIGrid,
    CustomerType,
    PerformanceDrivers,
    EngagementSection,
    PageHotspots,
    SKUAnalysis,
    BasketAnalysis,
    PromoAnalysis,
    GeographicMap,
    ChartsSection,
    DataTables,
    TotalAvailableProds,
    EventBreakdown // NEW COMPONENT
  },
  setup() {
    // ==================== CONSTANTS ====================
    const API_BASE = import.meta.env.VITE_API_BASE || 'https://google-analytics-api-1.onrender.com'
    
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

    // ==================== STATE ====================
    const today = new Date().toISOString().split('T')[0]
    
    // Date ranges
    const dateRange = reactive({ 
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: today
    })
    
    const comparisonRange = reactive({ 
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    
    const selectedQuickRange = ref('')
    const enableComparison = ref(false)
    const loading = ref(false)
    const showTables = ref(false)
    const showHotspots = ref(true)
    const activeLocationTab = ref('session')
    
    // Expanded state
    const expandedKPI = ref(null)
    const expandedEngagement = ref(null)
    const expandedPage = ref(null)
    const expandedBasket = ref(null)
    const expandedCity = ref(null)
    
    // Metrics and views
    const revenueChartMetric = ref('revenue')
    const sessionChartMetric = ref('sessions')
    const mapMetric = ref('revenue')
    const mapView = ref('current')
    const revenueChartView = ref('sideBySide')
    const sessionChartView = ref('sideBySide')

    // Data containers
    const locationSessionData = ref([])
    const locationSessionComparison = ref([])
    const locationRevenueData = ref([])
    const locationRevenueComparison = ref([])
    const sourceData = ref([])
    const sourceComparison = ref([])
    const engagementData = ref([])
    const engagementComparison = ref([])
    const pageHotspots = ref([])
    const pageHotspotsComparison = ref([])
    const basketSizeData = ref([])
    const basketSizeComparison = ref([])
    const eventData = ref([]) // NEW DATA CONTAINER

    // Map refs
    let map = null
    let markers = []
    let highlightedMarker = null
    let L = null

    // ==================== UTILITIES ====================
    const formatters = {
      zar: (value) => {
        if (value == null || isNaN(value)) return 'R0'
        return new Intl.NumberFormat('en-ZA', { 
          style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(value)
      },
      number: (value) => {
        if (value == null || isNaN(value)) return '0'
        return new Intl.NumberFormat('en-ZA').format(value)
      },
      percent: (value) => {
        if (value == null || isNaN(value)) return '0%'
        return new Intl.NumberFormat('en-ZA', { 
          style: 'percent', minimumFractionDigits: 1 
        }).format(value / 100)
      },
      truncate: (str, maxLength) => {
        if (!str) return str
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
      },
      delta: (value) => {
        if (value == null || isNaN(value)) return '—'
        const sign = value > 0 ? '+' : ''
        return `${sign}${Math.abs(value).toFixed(1)}%`
      },
      duration: (seconds) => {
        if (!seconds || isNaN(seconds)) return '0m'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
      }
    }

    const getDeltaClass = (delta) => {
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    }

    const formatDelta = (delta) => formatters.delta(delta)
    const formatDuration = (seconds) => formatters.duration(seconds)
    const formatZAR = (value) => formatters.zar(value)
    const formatNumber = (value) => formatters.number(value)
    const formatPercent = (value) => formatters.percent(value)
    const truncateString = (str, maxLength) => formatters.truncate(str, maxLength)

    const calculateDelta = (current, previous) => {
      if (previous == null || previous === 0 || current == null) return null
      return ((current - previous) / previous) * 100
    }

    // ==================== COMPUTED ====================
    const saCities = computed(() => {
      const cities = []
      
      locationRevenueData.value.forEach(revenueItem => {
        if (!revenueItem.country?.toLowerCase().includes('south africa') && 
            !Object.keys(CITY_COORDINATES).some(city => revenueItem.city?.toLowerCase().includes(city))) {
          return
        }
        
        const cityKey = Object.keys(CITY_COORDINATES).find(city => revenueItem.city?.toLowerCase().includes(city))
        const coords = cityKey ? CITY_COORDINATES[cityKey] : null
        if (!coords) return
        
        const sessionItem = locationSessionData.value.find(s => s.city === revenueItem.city)
        const sessionCompare = locationSessionComparison.value.find(s => s.city === revenueItem.city)
        const revenueCompare = locationRevenueComparison.value.find(r => r.city === revenueItem.city)
        
        cities.push({
          name: revenueItem.city || 'Unknown',
          lat: coords.lat,
          lng: coords.lng,
          revenue: revenueItem.purchaseRevenue || 0,
          transactions: revenueItem.transactions || 0,
          conversions: revenueItem.conversions || 0,
          sessions: sessionItem?.sessions || 0,
          conversionRate: sessionItem?.sessionConversionRate || 0,
          revenueComparison: revenueCompare?.purchaseRevenue || 0,
          transactionsComparison: revenueCompare?.transactions || 0,
          conversionsComparison: revenueCompare?.conversions || 0,
          sessionsComparison: sessionCompare?.sessions || 0,
          conversionRateComparison: sessionCompare?.sessionConversionRate || 0,
          delta: calculateDelta(revenueItem.purchaseRevenue || 0, revenueCompare?.purchaseRevenue || 0)
        })
      })
      
      return cities.sort((a, b) => b.revenue - a.revenue)
    })

    const topPages = computed(() => {
      return pageHotspots.value
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map(page => {
          const comparison = pageHotspotsComparison.value.find(p => p.pagePath === page.pagePath) || {}
          return {
            ...page,
            viewsDelta: calculateDelta(page.views, comparison.views)
          }
        })
    })

    const kpiData = computed(() => {
      // Current period totals
      const totals = {
        revenue: locationRevenueData.value.reduce((sum, item) => sum + (item.purchaseRevenue || 0), 0),
        transactions: locationRevenueData.value.reduce((sum, item) => sum + (item.transactions || 0), 0),
        revenueConversions: locationRevenueData.value.reduce((sum, item) => sum + (item.conversions || 0), 0),
        sessions: locationSessionData.value.reduce((sum, item) => sum + (item.sessions || 0), 0),
        sessionConversions: locationSessionData.value.reduce((sum, item) => sum + (item.conversions || 0), 0),
        activeUsers: locationSessionData.value.reduce((sum, item) => sum + (item.activeUsers || 0), 0)
      }
      
      const totalConversions = Math.max(totals.revenueConversions, totals.sessionConversions)
      const avgConversionRate = locationSessionData.value.length > 0 
        ? locationSessionData.value.reduce((sum, item) => sum + (item.sessionConversionRate || 0), 0) / locationSessionData.value.length
        : 0

      const avgBasketSize = basketSizeData.value.length > 0
        ? basketSizeData.value.reduce((sum, item) => sum + (item.avgRevenuePerTransaction || 0), 0) / basketSizeData.value.length
        : 0

      // Comparison period totals
      let comparisonTotals = {
        revenue: 0, transactions: 0, conversions: 0, sessions: 0, conversionRate: 0, basketSize: 0
      }
      
      if (enableComparison.value) {
        const compRevenueTotal = locationRevenueComparison.value.reduce((sum, item) => sum + (item.purchaseRevenue || 0), 0)
        const compRevenueConversions = locationRevenueComparison.value.reduce((sum, item) => sum + (item.conversions || 0), 0)
        const compSessionConversions = locationSessionComparison.value.reduce((sum, item) => sum + (item.conversions || 0), 0)
        const compBasketSize = basketSizeComparison.value.length > 0
          ? basketSizeComparison.value.reduce((sum, item) => sum + (item.avgRevenuePerTransaction || 0), 0) / basketSizeComparison.value.length
          : 0
        
        comparisonTotals = {
          revenue: compRevenueTotal,
          transactions: locationRevenueComparison.value.reduce((sum, item) => sum + (item.transactions || 0), 0),
          conversions: Math.max(compRevenueConversions, compSessionConversions),
          sessions: locationSessionComparison.value.reduce((sum, item) => sum + (item.sessions || 0), 0),
          conversionRate: locationSessionComparison.value.length > 0
            ? locationSessionComparison.value.reduce((sum, item) => sum + (item.sessionConversionRate || 0), 0) / locationSessionComparison.value.length
            : 0,
          basketSize: compBasketSize
        }
      }

      const kpiConfigs = [
        { label: 'Total Revenue', value: totals.revenue, rawValue: totals.revenue,
          compValue: comparisonTotals.revenue, rawComparison: comparisonTotals.revenue,
          formatter: formatZAR, icon: 'trending_up', color: '#10b981' },
        { label: 'Transactions', value: totals.transactions, rawValue: totals.transactions,
          compValue: comparisonTotals.transactions, rawComparison: comparisonTotals.transactions,
          formatter: formatNumber, icon: 'shopping_cart', color: '#3b82f6' },
        { label: 'Sessions', value: totals.sessions, rawValue: totals.sessions,
          compValue: comparisonTotals.sessions, rawComparison: comparisonTotals.sessions,
          formatter: formatNumber, icon: 'visibility', color: '#f59e0b' },
        { label: 'Conversions', value: totalConversions, rawValue: totalConversions,
          compValue: comparisonTotals.conversions, rawComparison: comparisonTotals.conversions,
          formatter: formatNumber, icon: 'conversion_path', color: '#8b5cf6' },
        { label: 'Avg. Conv. Rate', value: avgConversionRate, rawValue: avgConversionRate,
          compValue: comparisonTotals.conversionRate, rawComparison: comparisonTotals.conversionRate,
          formatter: formatPercent, icon: 'percent', color: '#ec4899' },
        { label: 'Avg. Basket Size', value: avgBasketSize, rawValue: avgBasketSize,
          compValue: comparisonTotals.basketSize, rawComparison: comparisonTotals.basketSize,
          formatter: formatZAR, icon: 'shopping_basket', color: '#f97316' }
      ]

      return kpiConfigs.map(config => ({
        ...config,
        value: config.formatter(config.value),
        comparisonValue: enableComparison.value ? config.formatter(config.compValue) : null,
        delta: calculateDelta(config.value, config.compValue),
        trend: calculateDelta(config.value, config.compValue) || 0
      }))
    })

    const hasData = computed(() => {
      return locationSessionData.value.length > 0 || 
             locationRevenueData.value.length > 0 || 
             sourceData.value.length > 0 ||
             engagementData.value.length > 0 ||
             pageHotspots.value.length > 0 ||
             basketSizeData.value.length > 0 ||
             eventData.value.length > 0 // ADDED EVENT DATA CHECK
    })

    // ==================== API FUNCTIONS ====================
    const formatDateForAPI = (date) => date

    const fetchData = async (endpoint) => {
      const url = new URL(`${API_BASE}${endpoint}`)
      url.searchParams.append('startDate', formatDateForAPI(dateRange.startDate))
      url.searchParams.append('endDate', formatDateForAPI(dateRange.endDate))
      
      if (enableComparison.value) {
        url.searchParams.append('compareStartDate', formatDateForAPI(comparisonRange.startDate))
        url.searchParams.append('compareEndDate', formatDateForAPI(comparisonRange.endDate))
      }
      
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Fetch failed: ${endpoint}`)
      return await res.json()
    }

    // Enhanced data processing with better matching and debugging
    const findMatch = (array, criteria) => {
      if (!array?.length) return null
      
      // Try exact match first
      let match = array.find(item => 
        Object.keys(criteria).every(key => item[key] === criteria[key])
      )
      
      // Try normalized match if exact fails
      if (!match) {
        match = array.find(item =>
          Object.keys(criteria).every(key => 
            String(item[key] || '').trim().toLowerCase() === 
            String(criteria[key] || '').trim().toLowerCase()
          )
        )
      }
      
      return match
    }

    const processSessionData = (current, comparison) => {
      return current.map(item => {
        const comp = findMatch(comparison, { city: item.city, country: item.country }) || {}
        
        // Log first item for debugging
        if (current.indexOf(item) === 0) {
          console.log('Session data sample:', {
            city: item.city,
            currentRate: item.sessionConversionRate,
            compRate: comp.sessionConversionRate,
            delta: calculateDelta(item.sessionConversionRate, comp.sessionConversionRate)
          })
        }
        
        return {
          ...item,
          sessionsDelta: calculateDelta(item.sessions, comp.sessions),
          conversionsDelta: calculateDelta(item.conversions, comp.conversions),
          conversionRateDelta: calculateDelta(item.sessionConversionRate, comp.sessionConversionRate),
          activeUsersDelta: calculateDelta(item.activeUsers, comp.activeUsers),
          newUsersDelta: calculateDelta(item.newUsers, comp.newUsers)
        }
      })
    }

    const processRevenueData = (current, comparison) => {
      return current.map(item => {
        const comp = findMatch(comparison, { city: item.city, country: item.country }) || {}
        const currentAOV = item.transactions ? item.purchaseRevenue / item.transactions : 0
        const comparisonAOV = comp.transactions ? comp.purchaseRevenue / comp.transactions : 0
        
        return {
          ...item,
          revenueDelta: calculateDelta(item.purchaseRevenue, comp.purchaseRevenue),
          transactionsDelta: calculateDelta(item.transactions, comp.transactions),
          conversionsDelta: calculateDelta(item.conversions, comp.conversions),
          aovDelta: calculateDelta(currentAOV, comparisonAOV)
        }
      })
    }

    const processSourceData = (current, comparison) => {
      // Build lookup map for better performance
      const comparisonMap = new Map()
      comparison.forEach(item => {
        const key = `${item.channel}|${item.deviceCategory}|${item.campaignName}`.toLowerCase()
        comparisonMap.set(key, item)
      })
      
      return current.map(item => {
        const key = `${item.channel}|${item.deviceCategory}|${item.campaignName}`.toLowerCase()
        const comp = comparisonMap.get(key) || {}
        
        // Log first item for debugging
        if (current.indexOf(item) === 0) {
          console.log('Source data sample:', {
            channel: item.channel,
            currentRate: item.sessionConversionRate,
            compRate: comp.sessionConversionRate,
            hasMatch: !!comparisonMap.get(key),
            delta: calculateDelta(item.sessionConversionRate, comp.sessionConversionRate)
          })
        }
        
        return {
          ...item,
          sessionsDelta: calculateDelta(item.sessions, comp.sessions),
          conversionsDelta: calculateDelta(item.conversions, comp.conversions),
          conversionRateDelta: calculateDelta(item.sessionConversionRate, comp.sessionConversionRate)
        }
      })
    }

    const processEngagementData = (current, comparison) => {
      const comparisonMap = new Map()
      comparison.forEach(item => {
        comparisonMap.set(item.deviceCategory?.toLowerCase(), item)
      })
      
      return current.map(item => {
        const comp = comparisonMap.get(item.deviceCategory?.toLowerCase()) || {}
        
        return {
          ...item,
          sessionsDelta: calculateDelta(item.sessions, comp.sessions),
          newUsersDelta: calculateDelta(item.newUsers, comp.newUsers),
          activeUsersDelta: calculateDelta(item.activeUsers, comp.activeUsers),
          durationDelta: calculateDelta(item.avgSessionDuration, comp.avgSessionDuration),
          engagedSessionsDelta: calculateDelta(item.engagedSessions, comp.engagedSessions)
        }
      })
    }

    const processPageHotspots = (current, comparison) => {
      const comparisonMap = new Map()
      comparison.forEach(item => {
        comparisonMap.set(item.pagePath, item)
      })
      
      return current.map(item => {
        const comp = comparisonMap.get(item.pagePath) || {}
        
        return {
          ...item,
          viewsDelta: calculateDelta(item.views, comp.views)
        }
      })
    }

    const processBasketSizeData = (current, comparison) => {
      const comparisonMap = new Map()
      comparison.forEach(item => {
        comparisonMap.set(item.country, item)
      })
      
      return current.map(item => {
        const comp = comparisonMap.get(item.country) || {}
        const currentAvgBasketSize = item.transactions ? item.itemsPurchased / item.transactions : 0
        const comparisonAvgBasketSize = comp.transactions ? comp.itemsPurchased / comp.transactions : 0
        
        return {
          ...item,
          revenueDelta: calculateDelta(item.purchaseRevenue, comp.purchaseRevenue),
          transactionsDelta: calculateDelta(item.transactions, comp.transactions),
          itemsDelta: calculateDelta(item.itemsPurchased, comp.itemsPurchased),
          avgBasketSizeDelta: calculateDelta(currentAvgBasketSize, comparisonAvgBasketSize),
          aovDelta: calculateDelta(item.avgRevenuePerTransaction, comp.avgRevenuePerTransaction)
        }
      })
    }

    const fetchAllData = async () => {
      loading.value = true
      
      // Reset expanded states
      expandedKPI.value = null
      expandedEngagement.value = null
      expandedPage.value = null
      expandedBasket.value = null
      expandedCity.value = null
      
      try {
        const [
          sessionResponse, 
          revenueResponse, 
          sourceResponse,
          engagementResponse,
          pageResponse,
          basketResponse,
          eventResponse // NEW API RESPONSE
        ] = await Promise.all([
          fetchData('/analytics/conversions-by-location'),
          fetchData('/analytics/revenue-by-location'),
          fetchData('/analytics/conversions-by-source'),
          fetchData('/analytics/engagement'),
          fetchData('/analytics/page-hotspots'),
          fetchData('/analytics/basket-size'),
          fetchData('/analytics/conversions-by-event') // NEW API CALL
        ])
        
        // Store raw comparison data
        locationSessionComparison.value = sessionResponse.comparisonPeriod || []
        locationRevenueComparison.value = revenueResponse.comparisonPeriod || []
        sourceComparison.value = sourceResponse.comparisonPeriod || []
        engagementComparison.value = engagementResponse.comparisonPeriod || []
        pageHotspotsComparison.value = pageResponse.comparisonPeriod || []
        basketSizeComparison.value = basketResponse.comparisonPeriod || []
        
        // Process data with deltas using enhanced matching
        locationSessionData.value = processSessionData(
          sessionResponse.currentPeriod || [], 
          locationSessionComparison.value
        )
        
        locationRevenueData.value = processRevenueData(
          revenueResponse.currentPeriod || [], 
          locationRevenueComparison.value
        )
        
        sourceData.value = processSourceData(
          sourceResponse.currentPeriod || [], 
          sourceComparison.value
        )
        
        engagementData.value = processEngagementData(
          engagementResponse.currentPeriod || [], 
          engagementComparison.value
        )
        
        pageHotspots.value = processPageHotspots(
          pageResponse.currentPeriod || [], 
          pageHotspotsComparison.value
        )
        
        basketSizeData.value = processBasketSizeData(
          basketResponse.currentPeriod || [], 
          basketSizeComparison.value
        )

        // Store event data (no comparison needed for events)
        eventData.value = eventResponse.currentPeriod || [] // NEW DATA ASSIGNMENT
        
        // Log summary
        console.log('Data processing complete:', {
          sessionItems: locationSessionData.value.length,
          revenueItems: locationRevenueData.value.length,
          sourceItems: sourceData.value.length,
          sourceComparisonItems: sourceComparison.value.length,
          eventItems: eventData.value.length // ADDED EVENT LOG
        })
        
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        loading.value = false
      }
    }

    // ==================== QUICK RANGE FUNCTIONS ====================
    const applyQuickRange = () => {
      const end = new Date()
      let start = new Date()
      
      const rangeConfigs = {
        '7daysAgo': { days: 7, compDays: 8 },
        '30daysAgo': { days: 30, compDays: 31 },
        '90daysAgo': { days: 90, compDays: 91 },
        'thisMonth': { type: 'month' },
        'lastMonth': { type: 'lastMonth' },
        'thisYear': { type: 'year' }
      }

      const config = rangeConfigs[selectedQuickRange.value]
      if (!config) return

      if (config.days) {
        start.setDate(end.getDate() - config.days)
        comparisonRange.endDate = new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        comparisonRange.startDate = new Date(start.getTime() - config.compDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      } else if (config.type === 'month') {
        start = new Date(end.getFullYear(), end.getMonth(), 1)
        comparisonRange.startDate = new Date(end.getFullYear(), end.getMonth() - 1, 1).toISOString().split('T')[0]
        comparisonRange.endDate = new Date(end.getFullYear(), end.getMonth(), 0).toISOString().split('T')[0]
      } else if (config.type === 'lastMonth') {
        start = new Date(end.getFullYear(), end.getMonth() - 1, 1)
        end.setDate(0)
        comparisonRange.startDate = new Date(end.getFullYear(), end.getMonth() - 1, 1).toISOString().split('T')[0]
        comparisonRange.endDate = new Date(end.getFullYear(), end.getMonth(), 0).toISOString().split('T')[0]
      } else if (config.type === 'year') {
        start = new Date(end.getFullYear(), 0, 1)
        comparisonRange.startDate = new Date(end.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
        comparisonRange.endDate = new Date(end.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
      }
      
      dateRange.startDate = start.toISOString().split('T')[0]
      dateRange.endDate = end.toISOString().split('T')[0]
      fetchAllData()
    }

    // ==================== EXPORT FUNCTIONS ====================
    const exportToCSV = () => {
      const data = [
        ['Hirsch\'s Conversion Intelligence Report'],
        [`Main Period: ${dateRange.startDate} to ${dateRange.endDate}`],
        ...(enableComparison.value ? [[`Comparison Period: ${comparisonRange.startDate} to ${comparisonRange.endDate}`]] : []),
        [],
        ['SESSIONS & USERS BY LOCATION'],
        ['City', 'Country', 'Sessions', 'Conversions', 'Conversion Rate', 'Active Users', 'New Users'],
        ...locationSessionData.value.map(item => [
          item.city || '—', item.country || '—', item.sessions, item.conversions,
          (item.sessionConversionRate / 100).toFixed(3), item.activeUsers, item.newUsers
        ]),
        [],
        ['REVENUE BY LOCATION (ZAR)'],
        ['City', 'Country', 'Revenue (ZAR)', 'Transactions', 'Conversions', 'Avg Order Value (ZAR)'],
        ...locationRevenueData.value.map(item => [
          item.city || '—', item.country || '—', item.purchaseRevenue, item.transactions, item.conversions,
          item.transactions ? (item.purchaseRevenue / item.transactions).toFixed(2) : 0
        ]),
        [],
        ['SOURCE ANALYSIS'],
        ['Channel', 'Device', 'Campaign', 'Sessions', 'Conversions', 'Conversion Rate'],
        ...sourceData.value.map(item => [
          item.channel || 'Other', item.deviceCategory || '—', item.campaignName || '—',
          item.sessions, item.conversions, (item.sessionConversionRate / 100).toFixed(3)
        ]),
        [],
        ['DEVICE ENGAGEMENT'],
        ['Device', 'Sessions', 'New Users', 'Active Users', 'Avg Session Duration', 'Engaged Sessions'],
        ...engagementData.value.map(item => [
          item.deviceCategory || '—', item.sessions, item.newUsers, item.activeUsers,
          Math.round(item.avgSessionDuration / 60) + 'm', item.engagedSessions
        ]),
        [],
        ['TOP PAGES'],
        ['Page Title', 'Page Path', 'Views'],
        ...pageHotspots.value.slice(0, 20).map(item => [
          item.pageTitle || '—', item.pagePath || '—', item.views
        ]),
        [],
        ['BASKET ANALYSIS'],
        ['Country', 'Revenue', 'Transactions', 'Items', 'Avg Basket Size', 'Avg Order Value'],
        ...basketSizeData.value.map(item => [
          item.country || 'Global', 
          item.purchaseRevenue, 
          item.transactions, 
          item.itemsPurchased,
          item.avgBasketSize?.toFixed(1),
          item.avgRevenuePerTransaction?.toFixed(2)
        ]),
        [],
        ['EVENT BREAKDOWN'], // NEW EVENT SECTION
        ['Event Name', 'Event Count', 'Percentage'],
        ...eventData.value.map(item => [
          item.eventName || '—',
          item.eventCount,
          item.percentage + '%'
        ])
      ]
      
      const csvContent = data.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `hirsch_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    }

    // ==================== MAP FUNCTIONS ====================
    const highlightCity = (city) => {
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

    const resetHighlight = () => {
      if (highlightedMarker) {
        highlightedMarker.setStyle({ weight: 2, color: '#ffffff' })
        highlightedMarker.closePopup()
        highlightedMarker = null
      }
    }

    // ==================== EXPAND TOGGLE FUNCTIONS ====================
    const toggleExpandKPI = (label) => {
      expandedKPI.value = expandedKPI.value === label ? null : label
    }
    
    const toggleExpandEngagement = (device) => {
      expandedEngagement.value = expandedEngagement.value === device ? null : device
    }
    
    const toggleExpandPage = (path) => {
      expandedPage.value = expandedPage.value === path ? null : path
    }
    
    const toggleExpandBasket = (country) => {
      expandedBasket.value = expandedBasket.value === country ? null : country
    }
    
    const toggleExpandCity = (cityName) => {
      expandedCity.value = expandedCity.value === cityName ? null : cityName
    }

    // ==================== LIFECYCLE ====================
    onMounted(fetchAllData)

    return {
      today,
      dateRange, 
      comparisonRange,
      selectedQuickRange,
      enableComparison,
      loading, 
      showTables, 
      showHotspots,
      activeLocationTab, 
      expandedKPI,
      expandedEngagement,
      expandedPage,
      expandedBasket,
      expandedCity,
      revenueChartMetric, 
      sessionChartMetric, 
      mapMetric,
      mapView,
      revenueChartView,
      sessionChartView,
      locationSessionData, 
      locationSessionComparison,
      locationRevenueData, 
      locationRevenueComparison,
      sourceData, 
      sourceComparison,
      engagementData,
      pageHotspots,
      basketSizeData,
      eventData, // NEW RETURN VALUE
      topPages,
      saCities, 
      kpiData,
      hasData,
      fetchAllData,
      applyQuickRange,
      exportToCSV,
      toggleExpandKPI,
      toggleExpandEngagement,
      toggleExpandPage,
      toggleExpandBasket,
      toggleExpandCity,
      formatZAR,
      formatNumber, 
      formatPercent,
      formatDuration,
      truncateString, 
      formatDelta,
      getDeltaClass,
      highlightCity, 
      resetHighlight
    }
  }
}
</script>

<style>
/* Import Leaflet CSS */
@import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0,1');

:root {
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --success: #10b981;
  --success-dark: #059669;
  --warning: #f59e0b;
  --danger: #ef4444;
  --purple: #8b5cf6;
  --pink: #ec4899;
  --orange: #f97316;
  
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;
  
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dashboard {
  font-family: 'Inter', sans-serif;
  background: var(--gray-100);
  min-height: 100vh;
  color: var(--gray-800);
}

.dashboard-header {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  padding: var(--space-8) var(--space-8) 3rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--space-2);
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #94a3b8;
  font-size: 1rem;
}

.dashboard-content {
  max-width: 1400px;
  margin: -1.5rem auto var(--space-8);
  padding: 0 var(--space-8);
  position: relative;
}

.loading-skeleton {
  max-width: 1400px;
  margin: var(--space-8) auto;
  padding: 0 var(--space-8);
}

.skeleton-card {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.skeleton-header {
  height: 24px;
  width: 200px;
  background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-4);
}

.skeleton-chart {
  height: 300px;
  background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-lg);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: var(--space-6) var(--space-6) 2.5rem;
  }
  
  .dashboard-content {
    padding: 0 var(--space-4);
  }
}
</style>