<template>
  <div v-if="!isAuthenticated" class="login-wrapper">
    <LoginForm @login-success="handleLoginSuccess" />
  </div>
  
  <div v-else class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-top">
          <div>
            <h1>Hirsch's Conversion Intelligence</h1>
            <p class="subtitle">
              Track sales, understand why conversions change, and see where those changes happen geographically:
            </p>
          </div>
          <button @click="handleLogout" class="logout-button">
            <span class="material-symbols-outlined">logout</span>
            Logout ({{ username }})
          </button>
        </div>
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

      <!-- Sales Trend Line Chart -->
      <SalesTrendChart
        :seriesData="salesTrendData"
        :granularity="salesTrendGranularity"
        @update:granularity="changeSalesTrendGranularity"
      />
      
    <TotalAvailableProds 
  :startDate="dateRange.startDate"
  :endDate="dateRange.endDate"
/>

      <!-- Customer Type Component -->
      <CustomerType 
        :engagementData="engagementData"
        :engagementComparison="engagementComparison"
        :enableComparison="enableComparison"
        :comparisonStartDate="comparisonRange.startDate"
        :comparisonEndDate="comparisonRange.endDate"
      />

      <!-- Page Details Section -->
      <PageDetailsSection
        :pageData="pageDetailsData"
        :loading="pageDetailsLoading"
        :enableComparison="enableComparison"
        :comparisonStartDate="comparisonRange.startDate"
        :comparisonEndDate="comparisonRange.endDate"
        @search="fetchPageDetails"
      />

      <!-- Campaign Details Section -->
      <CampaignDetailsSection
        :campaignData="campaignDetailsData"
        :loading="campaignDetailsLoading"
        :enableComparison="enableComparison"
        :comparisonStartDate="comparisonRange.startDate"
        :comparisonEndDate="comparisonRange.endDate"
        @search="fetchCampaignDetails"
      />

      <!-- Performance Drivers Component -->
      <PerformanceDrivers
        :sessionData="locationSessionData"
        :sessionComparison="locationSessionComparison"
        :basketData="basketSizeData"
        :basketComparison="basketSizeComparison"
        :engagementData="engagementData"
        :enableComparison="enableComparison"
        :comparisonStartDate="comparisonRange.startDate"
        :comparisonEndDate="comparisonRange.endDate"
        @toggleExpand="handleDriverExpand"
      />

      <!-- Engagement Section Component -->
      <EngagementSection
        :engagementData="engagementData"
        :enableComparison="enableComparison"
        :expandedEngagement="expandedEngagement"
        @toggleExpand="toggleExpandEngagement"
      />

      <!-- Event Breakdown Component with Comparison Support -->
      <EventBreakdown
        :events="eventData"
        :comparisonEvents="eventComparisonData"
        :enableComparison="enableComparison"
        :comparisonStartDate="comparisonRange.startDate"
        :comparisonEndDate="comparisonRange.endDate"
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
      <SKUAnalysis 
        :basketData="basketSizeData"
        :basketComparison="basketSizeComparison"
        :enableComparison="enableComparison"
        :comparisonStartDate="comparisonRange.startDate"
        :comparisonEndDate="comparisonRange.endDate"
      />

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
        :sourceComparison="sourceComparison"
        :sessionData="locationSessionData"
        :sessionComparison="locationSessionComparison"
        :basketData="basketSizeData"
        :basketComparison="basketSizeComparison"
        :enableComparison="enableComparison"
        :comparisonStartDate="comparisonRange.startDate"
        :comparisonEndDate="comparisonRange.endDate"
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
import { ref, reactive, onMounted, computed, watch } from 'vue'
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
import SalesTrendChart from './SalesTrendChart.vue'
import EventBreakdown from './EventBreakdown.vue'
import LoginForm from './LoginForm.vue'
import PageDetailsSection from './PageDetailsSection.vue'
import CampaignDetailsSection from './CampaignDetailsSection.vue'

export default {
  name: 'Dashboard',
  components: {
    DateRangeSelector,
    KPIGrid,
    CustomerType,
    PageDetailsSection,
    CampaignDetailsSection,
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
    SalesTrendChart,
    EventBreakdown,
    LoginForm
  },
  setup() {
    // ==================== AUTHENTICATION STATE ====================
    const isAuthenticated = ref(false)
    const username = ref('')
    const password = ref('')

    const checkAuth = () => {
      const auth = localStorage.getItem('isAuthenticated') === 'true'
      const user = localStorage.getItem('username') || ''
      const pass = localStorage.getItem('password') || ''
      isAuthenticated.value = auth
      username.value = user
      password.value = pass
    }

    const handleLoginSuccess = (user) => {
      isAuthenticated.value = true
      username.value = user
      password.value = localStorage.getItem('password') || ''
      fetchAllData()
    }

    const handleLogout = () => {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('username')
      localStorage.removeItem('password')
      isAuthenticated.value = false
      username.value = ''
      password.value = ''
    }

    if (process.client) {
      window.addEventListener('login-state-changed', checkAuth)
    }

    // ==================== CONSTANTS ====================
    const API_BASE = import.meta.env.VITE_API_BASE || 'https://conversions-api-0e62e1f06b26.herokuapp.com' 
    //'https://google-analytics-api-1.onrender.com' //'http://localhost:3001'
    
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

    const QUICK_RANGE_CONFIGS = {
      '7daysAgo': { days: 7, compDays: 8 },
      '30daysAgo': { days: 30, compDays: 31 },
      '90daysAgo': { days: 90, compDays: 91 },
      'thisMonth': { type: 'month' },
      'lastMonth': { type: 'lastMonth' },
      'thisYear': { type: 'year' }
    }

    // ==================== UTILITIES ====================
    const utils = {
      calculateDelta: (current, previous) => {
        if (previous == null || previous === 0 || current == null) return null
        return ((current - previous) / previous) * 100
      },
      
      sumBy: (arr, key) => {
        if (!arr?.length) return 0
        return arr.reduce((sum, item) => sum + (item[key] || 0), 0)
      },
      
      avgBy: (arr, key) => {
        if (!arr?.length) return 0
        return utils.sumBy(arr, key) / arr.length
      },
      
      buildMap: (arr, keyFn) => {
        const map = new Map()
        if (!arr?.length) return map
        arr.forEach(item => map.set(keyFn(item), item))
        return map
      },
      
      buildCompositeKey: (...parts) => {
        return parts.map(p => String(p || '').trim().toLowerCase()).join('|')
      },
      
      findMatch: (array, criteria) => {
        if (!array?.length) return null
        
        let match = array.find(item => 
          Object.keys(criteria).every(key => item[key] === criteria[key])
        )
        
        if (!match) {
          match = array.find(item =>
            Object.keys(criteria).every(key => 
              String(item[key] || '').trim().toLowerCase() === 
              String(criteria[key] || '').trim().toLowerCase()
            )
          )
        }
        
        return match
      },
      
      formatters: {
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
        },
        truncate: (str, maxLength) => {
          if (!str) return str
          return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
        }
      },
      
      getDeltaClass: (delta) => {
        if (delta > 0) return 'positive'
        if (delta < 0) return 'negative'
        return 'neutral'
      },
      
      exportSection: (title, headers, rows, includeEmptyRow = true) => {
        const section = [
          [title],
          headers,
          ...rows
        ]
        if (includeEmptyRow) section.push([])
        return section
      }
    }

    const { calculateDelta, sumBy, avgBy, buildMap, buildCompositeKey, findMatch, formatters, getDeltaClass, exportSection } = utils
    const { zar: formatZAR, number: formatNumber, percent: formatPercent, delta: formatDelta, duration: formatDuration, truncate: truncateString } = formatters

    // ==================== STATE ====================
    const today = new Date().toISOString().split('T')[0]
    
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
    
    const expandedKPI = ref(null)
    const expandedEngagement = ref(null)
    const expandedPage = ref(null)
    const expandedBasket = ref(null)
    const expandedCity = ref(null)
    
    const revenueChartMetric = ref('revenue')
    const sessionChartMetric = ref('sessions')
    const mapMetric = ref('revenue')
    const mapView = ref('current')
    const revenueChartView = ref('sideBySide')
    const sessionChartView = ref('sideBySide')

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
    const eventData = ref([])
    const eventComparisonData = ref([])
    
    // Page Details specific state
    const pageDetailsData = ref([])
    const pageDetailsLoading = ref(false)

    // Campaign Details specific state
    const campaignDetailsData = ref([])
    const campaignDetailsLoading = ref(false)

    let map = null
    let markers = []
    let highlightedMarker = null
    let L = null

    // ==================== PROCESSORS ====================
    const processors = {
      session: (current, comparison) => {
        const comparisonMap = buildMap(comparison, item => buildCompositeKey(item.city, item.country))
        
        return current.map(item => {
          const comp = comparisonMap.get(buildCompositeKey(item.city, item.country)) || {}
          
          return {
            ...item,
            sessionsDelta: calculateDelta(item.sessions, comp.sessions),
            conversionsDelta: calculateDelta(item.conversions, comp.conversions),
            conversionRateDelta: calculateDelta(item.sessionConversionRate, comp.sessionConversionRate),
            activeUsersDelta: calculateDelta(item.activeUsers, comp.activeUsers),
            newUsersDelta: calculateDelta(item.newUsers, comp.newUsers)
          }
        })
      },
      
      revenue: (current, comparison) => {
        const comparisonMap = buildMap(comparison, item => buildCompositeKey(item.city, item.country))
        
        return current.map(item => {
          const comp = comparisonMap.get(buildCompositeKey(item.city, item.country)) || {}
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
      },
      
      source: (current, comparison) => {
        const comparisonMap = buildMap(comparison, item => 
          buildCompositeKey(item.channel, item.deviceCategory, item.campaignName)
        )
        
        return current.map(item => {
          const key = buildCompositeKey(item.channel, item.deviceCategory, item.campaignName)
          const comp = comparisonMap.get(key) || {}
          
          return {
            ...item,
            sessionsDelta: calculateDelta(item.sessions, comp.sessions),
            conversionsDelta: calculateDelta(item.conversions, comp.conversions),
            conversionRateDelta: calculateDelta(item.sessionConversionRate, comp.sessionConversionRate)
          }
        })
      },
      
      engagement: (current, comparison) => {
        const comparisonMap = buildMap(comparison, item => item.deviceCategory?.toLowerCase())
        
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
      },
      
      pageHotspots: (current, comparison) => {
        const comparisonMap = buildMap(comparison, item => item.pagePath)
        
        return current.map(item => {
          const comp = comparisonMap.get(item.pagePath) || {}
          
          return {
            ...item,
            viewsDelta: calculateDelta(item.views, comp.views)
          }
        })
      },
      
      basketSize: (current, comparison) => {
        const comparisonMap = buildMap(comparison, item => item.country)
        
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
        
        const sessionItem = findMatch(locationSessionData.value, { city: revenueItem.city })
        const sessionCompare = findMatch(locationSessionComparison.value, { city: revenueItem.city })
        const revenueCompare = findMatch(locationRevenueComparison.value, { city: revenueItem.city })
        
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
          const comparison = findMatch(pageHotspotsComparison.value, { pagePath: page.pagePath }) || {}
          return {
            ...page,
            viewsDelta: calculateDelta(page.views, comparison.views)
          }
        })
    })

    const kpiData = computed(() => {
      const totals = {
        revenue: sumBy(locationRevenueData.value, 'purchaseRevenue'),
        transactions: sumBy(locationRevenueData.value, 'transactions'),
        revenueConversions: sumBy(locationRevenueData.value, 'conversions'),
        sessions: sumBy(locationSessionData.value, 'sessions'),
        sessionConversions: sumBy(locationSessionData.value, 'conversions'),
        activeUsers: sumBy(locationSessionData.value, 'activeUsers')
      }
      
      const totalConversions = Math.max(totals.revenueConversions, totals.sessionConversions)

      // Weighted, not averaged: a location with a handful of sessions and a
      // lucky 100% conversion rate shouldn't move the headline number as
      // much as a location with 50,000 sessions. Total conversions over
      // total sessions is the correct site-wide rate.
      // locationSessionData's sessionConversionRate is normalized to
      // percentage points (e.g. 3.4) in fetchAllData below, so no further
      // scaling is needed here.
      const avgConversionRate = totals.sessions > 0 ? (totalConversions / totals.sessions) * 100 : 0

      // Same principle for basket size: total revenue over total
      // transactions, not an average of each country's average order value.
      const basketTransactions = sumBy(basketSizeData.value, 'transactions')
      const basketRevenue = sumBy(basketSizeData.value, 'purchaseRevenue')
      const avgBasketSize = basketTransactions > 0 ? basketRevenue / basketTransactions : 0

      let comparisonTotals = {
        revenue: 0, transactions: 0, conversions: 0, sessions: 0, conversionRate: 0, basketSize: 0
      }
      
      if (enableComparison.value) {
        const compRevenueTotal = sumBy(locationRevenueComparison.value, 'purchaseRevenue')
        const compRevenueConversions = sumBy(locationRevenueComparison.value, 'conversions')
        const compSessionConversions = sumBy(locationSessionComparison.value, 'conversions')
        const compSessions = sumBy(locationSessionComparison.value, 'sessions')
        const compBasketTransactions = sumBy(basketSizeComparison.value, 'transactions')
        const compBasketRevenue = sumBy(basketSizeComparison.value, 'purchaseRevenue')
        
        comparisonTotals = {
          revenue: compRevenueTotal,
          transactions: sumBy(locationRevenueComparison.value, 'transactions'),
          conversions: Math.max(compRevenueConversions, compSessionConversions),
          sessions: compSessions,
          conversionRate: compSessions > 0 ? (compSessionConversions / compSessions) * 100 : 0,
          basketSize: compBasketTransactions > 0 ? compBasketRevenue / compBasketTransactions : 0
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
             eventData.value.length > 0
    })

    // ==================== PAGE DETAILS API FUNCTION ====================
    const fetchPageDetails = async (pageUrl) => {
      if (!pageUrl) return;
      
      pageDetailsLoading.value = true;
      
      try {
        console.log('Fetching page details with:');
        console.log('  Main period:', dateRange.startDate, 'to', dateRange.endDate);
        console.log('  Comparison enabled:', enableComparison.value);
        if (enableComparison.value) {
          console.log('  Comparison period:', comparisonRange.startDate, 'to', comparisonRange.endDate);
        }
        
        const params = new URLSearchParams();
        params.set('pageUrl', pageUrl);
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);

        if (enableComparison.value && comparisonRange.startDate && comparisonRange.endDate) {
          params.set('compareStartDate', comparisonRange.startDate);
          params.set('compareEndDate', comparisonRange.endDate);
          console.log('Added comparison params to URL');
        }
        
        const url = `${API_BASE}/analytics/page-details?${params.toString()}`;
        console.log('Full URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'x-username': username.value,
            'x-password': password.value
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            handleLogout();
            throw new Error('Session expired');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
        
        let processedData = [];
        
        // Use mergedResult if available (has pre-calculated deltas)
        if (data.mergedResult && data.mergedResult.length > 0) {
          console.log('✅ Using mergedResult');
          // Convert string deltas to numbers for consistent handling
          processedData = data.mergedResult.map(item => ({
            ...item,
            viewsDelta: item.viewsDelta ? parseFloat(item.viewsDelta) : null,
            activeUsersDelta: item.activeUsersDelta ? parseFloat(item.activeUsersDelta) : null,
            durationDelta: item.durationDelta ? parseFloat(item.durationDelta) : null,
            engagementRateDelta: item.engagementRateDelta ? parseFloat(item.engagementRateDelta) : null,
            // Ensure numeric values are numbers
            views: Number(item.views),
            activeUsers: Number(item.activeUsers),
            avgSessionDuration: Number(item.avgSessionDuration),
            engagementRate: Number(item.engagementRate),
            // If comparisonData exists, ensure its values are also numbers
            comparisonData: item.comparisonData ? {
              views: Number(item.comparisonData.views),
              activeUsers: Number(item.comparisonData.activeUsers),
              avgSessionDuration: Number(item.comparisonData.avgSessionDuration),
              engagementRate: Number(item.comparisonData.engagementRate)
            } : null
          }));
        } 
        // Fallback to result format (no comparison)
        else if (data.result && data.result.length > 0) {
          console.log('✅ Using result (no comparison)');
          processedData = data.result.map(item => ({
            ...item,
            views: Number(item.views),
            activeUsers: Number(item.activeUsers),
            avgSessionDuration: Number(item.avgSessionDuration),
            engagementRate: Number(item.engagementRate),
            comparisonData: null,
            viewsDelta: null,
            activeUsersDelta: null,
            durationDelta: null,
            engagementRateDelta: null
          }));
        }
        // Fallback to currentPeriod format
        else if (data.currentPeriod && data.currentPeriod.length > 0) {
          console.log('✅ Using currentPeriod');
          processedData = data.currentPeriod.map(item => ({
            ...item,
            views: Number(item.views),
            activeUsers: Number(item.activeUsers),
            avgSessionDuration: Number(item.avgSessionDuration),
            engagementRate: Number(item.engagementRate),
            comparisonData: data.comparisonPeriod ? data.comparisonPeriod[0] : null,
            viewsDelta: data.comparisonPeriod ? ((item.views - data.comparisonPeriod[0].views) / data.comparisonPeriod[0].views * 100) : null,
            activeUsersDelta: data.comparisonPeriod ? ((item.activeUsers - data.comparisonPeriod[0].activeUsers) / data.comparisonPeriod[0].activeUsers * 100) : null,
            durationDelta: data.comparisonPeriod ? ((item.avgSessionDuration - data.comparisonPeriod[0].avgSessionDuration) / data.comparisonPeriod[0].avgSessionDuration * 100) : null,
            engagementRateDelta: data.comparisonPeriod ? ((item.engagementRate - data.comparisonPeriod[0].engagementRate) / data.comparisonPeriod[0].engagementRate * 100) : null
          }));
        }
        
        console.log('🎯 Final processed data:', processedData.length, 'items');
        if (processedData.length > 0) {
          console.log('📋 First item:', {
            pagePath: processedData[0].pagePath,
            views: processedData[0].views,
            viewsDelta: processedData[0].viewsDelta,
            hasComparisonData: !!processedData[0].comparisonData
          });
        }
        
        pageDetailsData.value = processedData;
        
      } catch (error) {
        console.error('❌ Error fetching page details:', error);
        pageDetailsData.value = [];
      } finally {
        pageDetailsLoading.value = false;
      }
    };

    // ==================== CAMPAIGN DETAILS API FUNCTION ====================
    const fetchCampaignDetails = async (campaignName) => {
      if (!campaignName) return;
      
      campaignDetailsLoading.value = true;
      
      try {
        console.log('Fetching campaign details for:', campaignName);
        console.log('  Main period:', dateRange.startDate, 'to', dateRange.endDate);
        console.log('  Comparison enabled:', enableComparison.value);
        if (enableComparison.value) {
          console.log('  Comparison period:', comparisonRange.startDate, 'to', comparisonRange.endDate);
        }
        
        const params = new URLSearchParams();
        params.set('campaignName', campaignName);
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);

        if (enableComparison.value && comparisonRange.startDate && comparisonRange.endDate) {
          params.set('compareStartDate', comparisonRange.startDate);
          params.set('compareEndDate', comparisonRange.endDate);
        }
        
        const url = `${API_BASE}/analytics/campaign-details?${params.toString()}`;
        
        const response = await fetch(url, {
          headers: {
            'x-username': username.value,
            'x-password': password.value
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            handleLogout();
            throw new Error('Session expired');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        let processedData = [];
        
        if (data.mergedResult && data.mergedResult.length > 0) {
          processedData = data.mergedResult.map(item => ({
            ...item,
            conversionsDelta: item.conversionsDelta ? parseFloat(item.conversionsDelta) : null,
            sessionsDelta: item.sessionsDelta ? parseFloat(item.sessionsDelta) : null,
            activeUsersDelta: item.activeUsersDelta ? parseFloat(item.activeUsersDelta) : null,
            conversionRateDelta: item.conversionRateDelta ? parseFloat(item.conversionRateDelta) : null,
            conversions: Number(item.conversions),
            sessions: Number(item.sessions),
            activeUsers: Number(item.activeUsers),
            sessionConversionRate: Number(item.sessionConversionRate),
            comparisonData: item.comparisonData ? {
              conversions: Number(item.comparisonData.conversions),
              sessions: Number(item.comparisonData.sessions),
              activeUsers: Number(item.comparisonData.activeUsers),
              sessionConversionRate: Number(item.comparisonData.sessionConversionRate)
            } : null
          }));
        } else if (data.currentPeriod && data.currentPeriod.length > 0) {
          processedData = data.currentPeriod.map(item => ({
            ...item,
            conversions: Number(item.conversions),
            sessions: Number(item.sessions),
            activeUsers: Number(item.activeUsers),
            sessionConversionRate: Number(item.sessionConversionRate),
            comparisonData: data.comparisonPeriod ? data.comparisonPeriod[0] : null,
            conversionsDelta: data.comparisonPeriod ? ((item.conversions - data.comparisonPeriod[0].conversions) / data.comparisonPeriod[0].conversions * 100) : null,
            sessionsDelta: data.comparisonPeriod ? ((item.sessions - data.comparisonPeriod[0].sessions) / data.comparisonPeriod[0].sessions * 100) : null,
            activeUsersDelta: data.comparisonPeriod ? ((item.activeUsers - data.comparisonPeriod[0].activeUsers) / data.comparisonPeriod[0].activeUsers * 100) : null,
            conversionRateDelta: data.comparisonPeriod ? ((item.sessionConversionRate - data.comparisonPeriod[0].sessionConversionRate) / data.comparisonPeriod[0].sessionConversionRate * 100) : null
          }));
        }
        
        campaignDetailsData.value = processedData;
        
      } catch (error) {
        console.error('Error fetching campaign details:', error);
        campaignDetailsData.value = [];
      } finally {
        campaignDetailsLoading.value = false;
      }
    };

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
      
      const headers = {
        'x-username': username.value,
        'x-password': password.value,
        'Content-Type': 'application/json'
      }
      
      const res = await fetch(url, { headers })
      
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout()
          throw new Error('Session expired')
        }
        throw new Error(`Fetch failed: ${endpoint}`)
      }
      
      const data = await res.json()
      return data
    }

    // ==================== SALES TREND STATE ====================
    const salesTrendData = ref([])
    const salesTrendGranularity = ref('day')

    const fetchSalesTrend = async () => {
      const url = new URL(`${API_BASE}/analytics/trends/timeseries`)
      url.searchParams.append('startDate', formatDateForAPI(dateRange.startDate))
      url.searchParams.append('endDate', formatDateForAPI(dateRange.endDate))
      url.searchParams.append('granularity', salesTrendGranularity.value)

      const res = await fetch(url, {
        headers: { 'x-username': username.value, 'x-password': password.value }
      })

      if (!res.ok) {
        if (res.status === 401) {
          handleLogout()
          throw new Error('Session expired')
        }
        throw new Error('Failed to fetch sales trend')
      }

      return res.json()
    }

    const changeSalesTrendGranularity = (granularity) => {
      salesTrendGranularity.value = granularity
      fetchSalesTrend()
        .then(res => { salesTrendData.value = res?.series || [] })
        .catch(err => console.error('Failed to refetch sales trend:', err))
    }

    // GA4's Data API returns sessionConversionRate as a raw fraction
    // (e.g. 0.034 for 3.4%), not a percentage-point number. Every part of
    // the app that reads sessionConversionRate off locationSessionData or
    // sourceData expects percentage-point form (matching how
    // PageDetailsSection/CampaignDetailsSection already handle their own,
    // separately-fetched data). Normalize once, here, so nothing downstream
    // has to guess at the unit.
    const normalizeConversionRate = (rows) =>
      (rows || []).map(item => ({
        ...item,
        sessionConversionRate: item.sessionConversionRate != null
          ? Number(item.sessionConversionRate) * 100
          : item.sessionConversionRate
      }))

    const fetchAllData = async () => {
      if (!isAuthenticated.value) return
      
      loading.value = true
      
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
          eventResponse,
          trendResponse
        ] = await Promise.all([
          fetchData('/analytics/conversions-by-location'),
          fetchData('/analytics/revenue-by-location'),
          fetchData('/analytics/conversions-by-source'),
          fetchData('/analytics/engagement'),
          fetchData('/analytics/page-hotspots'),
          fetchData('/analytics/basket-size'),
          fetchData('/analytics/conversions-by-event'),
          fetchSalesTrend()
        ])
        
        locationSessionComparison.value = normalizeConversionRate(sessionResponse.comparisonPeriod || [])
        locationRevenueComparison.value = revenueResponse.comparisonPeriod || []
        sourceComparison.value = normalizeConversionRate(sourceResponse.comparisonPeriod || [])
        engagementComparison.value = engagementResponse.comparisonPeriod || []
        pageHotspotsComparison.value = pageResponse.comparisonPeriod || []
        basketSizeComparison.value = basketResponse.comparisonPeriod || []
        
        locationSessionData.value = processors.session(
          normalizeConversionRate(sessionResponse.currentPeriod || []),
          locationSessionComparison.value
        )
        
        locationRevenueData.value = processors.revenue(
          revenueResponse.currentPeriod || [], 
          locationRevenueComparison.value
        )
        
        sourceData.value = processors.source(
          normalizeConversionRate(sourceResponse.currentPeriod || []),
          sourceComparison.value
        )
        
        engagementData.value = processors.engagement(
          engagementResponse.currentPeriod || [], 
          engagementComparison.value
        )
        
        pageHotspots.value = processors.pageHotspots(
          pageResponse.currentPeriod || [], 
          pageHotspotsComparison.value
        )
        
        basketSizeData.value = processors.basketSize(
          basketResponse.currentPeriod || [], 
          basketSizeComparison.value
        )

        eventData.value = eventResponse.currentPeriod || []
        eventComparisonData.value = eventResponse.comparisonPeriod || []

        salesTrendData.value = trendResponse?.series || []
        
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

      const config = QUICK_RANGE_CONFIGS[selectedQuickRange.value]
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
        ...exportSection('SESSIONS & USERS BY LOCATION',
          ['City', 'Country', 'Sessions', 'Conversions', 'Conversion Rate', 'Active Users', 'New Users'],
          locationSessionData.value.map(item => [
            item.city || '—', item.country || '—', item.sessions, item.conversions,
            (item.sessionConversionRate / 100).toFixed(3), item.activeUsers, item.newUsers
          ])
        ),
        ...exportSection('REVENUE BY LOCATION (ZAR)',
          ['City', 'Country', 'Revenue (ZAR)', 'Transactions', 'Conversions', 'Avg Order Value (ZAR)'],
          locationRevenueData.value.map(item => [
            item.city || '—', item.country || '—', item.purchaseRevenue, item.transactions, item.conversions,
            item.transactions ? (item.purchaseRevenue / item.transactions).toFixed(2) : 0
          ])
        ),
        ...exportSection('SOURCE ANALYSIS',
          ['Channel', 'Device', 'Campaign', 'Sessions', 'Conversions', 'Conversion Rate'],
          sourceData.value.map(item => [
            item.channel || 'Other', item.deviceCategory || '—', item.campaignName || '—',
            item.sessions, item.conversions, (item.sessionConversionRate / 100).toFixed(3)
          ])
        ),
        ...exportSection('DEVICE ENGAGEMENT',
          ['Device', 'Sessions', 'New Users', 'Active Users', 'Avg Session Duration', 'Engaged Sessions'],
          engagementData.value.map(item => [
            item.deviceCategory || '—', item.sessions, item.newUsers, item.activeUsers,
            Math.round(item.avgSessionDuration / 60) + 'm', item.engagedSessions
          ])
        ),
        ...exportSection('TOP PAGES',
          ['Page Title', 'Page Path', 'Views'],
          pageHotspots.value.slice(0, 20).map(item => [
            item.pageTitle || '—', item.pagePath || '—', item.views
          ])
        ),
        ...exportSection('BASKET ANALYSIS',
          ['Country', 'Revenue', 'Transactions', 'Items', 'Avg Basket Size', 'Avg Order Value'],
          basketSizeData.value.map(item => [
            item.country || 'Global', 
            item.purchaseRevenue, 
            item.transactions, 
            item.itemsPurchased,
            item.avgBasketSize?.toFixed(1),
            item.avgRevenuePerTransaction?.toFixed(2)
          ])
        ),
        ...exportSection('EVENT BREAKDOWN',
          ['Event Name', 'Event Count', 'Percentage'],
          eventData.value.map(item => [
            item.eventName || '—',
            item.eventCount,
            item.percentage + '%'
          ])
        ),
        ...(enableComparison.value && eventComparisonData.value.length > 0 ? exportSection('EVENT BREAKDOWN COMPARISON',
          ['Event Name', 'Previous Count', 'Previous Percentage', 'Change %'],
          eventData.value.map(item => {
            const comparison = findMatch(eventComparisonData.value, { eventName: item.eventName }) || {}
            const delta = calculateDelta(item.eventCount, comparison.eventCount)
            return [
              item.eventName || '—',
              comparison.eventCount || '—',
              comparison.percentage ? comparison.percentage + '%' : '—',
              delta ? formatDelta(delta) : '—'
            ]
          })
        ) : [])
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

    const handleDriverExpand = () => {
      // Placeholder for driver expand handler
    }

    // ==================== WATCHERS ====================
    // Watch for date changes to refetch page details
    watch([dateRange, comparisonRange, enableComparison], () => {
      // If we have page data loaded, refetch when dates change
      if (pageDetailsData.value.length > 0 && pageDetailsData.value[0]?.pagePath) {
        const currentPageUrl = pageDetailsData.value[0].pagePath
        console.log('Dates changed, refetching page details for:', currentPageUrl)
        fetchPageDetails(currentPageUrl)
      }
      // If we have campaign data loaded, refetch when dates change
      if (campaignDetailsData.value.length > 0 && campaignDetailsData.value[0]?.campaignName) {
        const currentCampaign = campaignDetailsData.value[0].campaignName
        console.log('Dates changed, refetching campaign details for:', currentCampaign)
        fetchCampaignDetails(currentCampaign)
      }
    }, { deep: true })

    // ==================== LIFECYCLE ====================
    onMounted(() => {
      checkAuth()
      if (isAuthenticated.value) {
        fetchAllData()
      }
    })

    return {
      // Auth
      isAuthenticated,
      username,
      password,
      handleLoginSuccess,
      handleLogout,
      
      // Page Details
      pageDetailsData,
      pageDetailsLoading,
      fetchPageDetails,
      
      // Campaign Details
      campaignDetailsData,
      campaignDetailsLoading,
      fetchCampaignDetails,
      
      // Original exports
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
      engagementComparison,
      pageHotspots,
      pageHotspotsComparison,
      basketSizeData,
      basketSizeComparison,
      eventData,
      eventComparisonData,
      salesTrendData,
      salesTrendGranularity,
      changeSalesTrendGranularity,
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
      handleDriverExpand,
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

.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.header-top h1 {
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

.logout-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.logout-button .material-symbols-outlined {
  font-size: 1.2rem;
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
  
  .header-top {
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .header-top h1 {
    font-size: 2rem;
  }
}
</style>