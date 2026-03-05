<template>
  <div class="dashboard">
    <!-- Header with gradient background -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Hirsch's Conversion Intelligence</h1>
        <p class="subtitle">Track sales, understand why conversions change, and see where those changes happen geographically</p>
      </div>
      
      <!-- Date Range Selector with Calendars & Comparison Toggle -->
      <div class="date-range-card">
        <div class="date-inputs">
          <!-- Main Period -->
          <div class="period-inputs">
            <h3 class="period-title">Main Period</h3>
            <div class="input-group">
              <label>Start Date</label>
              <div class="date-input-wrapper">
                <input type="date" v-model="dateRange.startDate" :max="dateRange.endDate" class="date-picker" />
                <span class="material-symbols-outlined date-icon">calendar_today</span>
              </div>
            </div>
            <div class="input-group">
              <label>End Date</label>
              <div class="date-input-wrapper">
                <input type="date" v-model="dateRange.endDate" :min="dateRange.startDate" :max="today" class="date-picker" />
                <span class="material-symbols-outlined date-icon">calendar_today</span>
              </div>
            </div>
          </div>

          <!-- Comparison Period (conditionally shown) -->
          <div v-if="enableComparison" class="period-inputs comparison">
            <h3 class="period-title">Comparison Period</h3>
            <div class="input-group">
              <label>Start Date</label>
              <div class="date-input-wrapper">
                <input type="date" v-model="comparisonRange.startDate" :max="comparisonRange.endDate" class="date-picker" />
                <span class="material-symbols-outlined date-icon">calendar_today</span>
              </div>
            </div>
            <div class="input-group">
              <label>End Date</label>
              <div class="date-input-wrapper">
                <input type="date" v-model="comparisonRange.endDate" :min="comparisonRange.startDate" :max="today" class="date-picker" />
                <span class="material-symbols-outlined date-icon">calendar_today</span>
              </div>
            </div>
          </div>

          <!-- Quick Select & Controls -->
          <div class="controls-group">
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

            <div class="toggle-group">
              <label class="toggle-switch">
                <input type="checkbox" v-model="enableComparison">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Compare to previous period</span>
              </label>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button @click="exportToCSV" :disabled="loading || !hasData" class="export-btn">
            <span class="material-symbols-outlined">download</span> Export CSV
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
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-header"></div>
        <div class="skeleton-chart"></div>
      </div>
    </div>

    <div v-else class="dashboard-content">
      <!-- KPI Cards with Comparison and Expand on Click -->
      <div class="kpi-grid">
        <div v-for="kpi in kpiData" :key="kpi.label" 
             class="kpi-card comparison-card" 
             :class="{ 'expanded': expandedKPI === kpi.label }"
             @click="toggleExpandKPI(kpi.label)">
          <div class="kpi-icon" :style="{ backgroundColor: kpi.color + '20' }">
            <span class="material-symbols-outlined" :style="{ color: kpi.color }">{{ kpi.icon }}</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">{{ kpi.label }}</span>
            <span class="kpi-value">{{ kpi.value }}</span>
            
            <div v-if="enableComparison && kpi.comparisonValue" class="comparison-values">
              <span class="comparison-label">Previous:</span>
              <span class="comparison-value">{{ kpi.comparisonValue }}</span>
              <span class="delta-badge" :class="getDeltaClass(kpi.delta)">
                <span v-if="kpi.delta > 0">↑</span>
                <span v-else-if="kpi.delta < 0">↓</span>
                {{ formatDelta(kpi.delta) }}
              </span>
            </div>
            
            <!-- Expanded view with full raw numbers -->
            <div v-if="expandedKPI === kpi.label" class="expanded-view">
              <div class="expanded-row">
                <span class="expanded-label">Raw Value:</span>
                <span class="expanded-value">{{ kpi.rawValue }}</span>
              </div>
              <div v-if="enableComparison && kpi.rawComparison" class="expanded-row">
                <span class="expanded-label">Raw Previous:</span>
                <span class="expanded-value">{{ kpi.rawComparison }}</span>
              </div>
              <div class="expanded-row">
                <span class="expanded-label">Click to collapse</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Engagement Overview Card with Expand on Click -->
      <div class="engagement-section" v-if="engagementData.length">
        <div class="engagement-header">
          <h2>Device Engagement Overview</h2>
        </div>
        <div class="engagement-grid">
          <div v-for="item in engagementData" :key="item.deviceCategory" 
               class="engagement-card clickable"
               :class="{ 'expanded': expandedEngagement === item.deviceCategory }"
               @click="toggleExpandEngagement(item.deviceCategory)">
            <div class="engagement-type">
              <span class="device-type-badge" :class="item.deviceCategory?.toLowerCase()">{{ item.deviceCategory || 'Unknown' }}</span>
            </div>
            <div class="engagement-stats">
              <div class="stat-item">
                <span class="stat-label">Sessions</span>
                <span class="stat-value">{{ formatNumber(item.sessions) }}</span>
                <span v-if="enableComparison" class="stat-delta" :class="getDeltaClass(item.sessionsDelta)">{{ formatDelta(item.sessionsDelta) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">New Users</span>
                <span class="stat-value">{{ formatNumber(item.newUsers) }}</span>
                <span v-if="enableComparison" class="stat-delta" :class="getDeltaClass(item.newUsersDelta)">{{ formatDelta(item.newUsersDelta) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Active Users</span>
                <span class="stat-value">{{ formatNumber(item.activeUsers) }}</span>
                <span v-if="enableComparison" class="stat-delta" :class="getDeltaClass(item.activeUsersDelta)">{{ formatDelta(item.activeUsersDelta) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Avg Session</span>
                <span class="stat-value">{{ formatDuration(item.avgSessionDuration) }}</span>
                <span v-if="enableComparison" class="stat-delta" :class="getDeltaClass(item.durationDelta)">{{ formatDelta(item.durationDelta) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Engaged</span>
                <span class="stat-value">{{ formatNumber(item.engagedSessions) }}</span>
                <span v-if="enableComparison" class="stat-delta" :class="getDeltaClass(item.engagedSessionsDelta)">{{ formatDelta(item.engagedSessionsDelta) }}</span>
              </div>
            </div>
            
            <!-- Expanded view with raw numbers -->
            <div v-if="expandedEngagement === item.deviceCategory" class="expanded-view">
              <div class="expanded-row">
                <span class="expanded-label">Sessions:</span>
                <span class="expanded-value">{{ item.sessions }}</span>
              </div>
              <div class="expanded-row">
                <span class="expanded-label">New Users:</span>
                <span class="expanded-value">{{ item.newUsers }}</span>
              </div>
              <div class="expanded-row">
                <span class="expanded-label">Active Users:</span>
                <span class="expanded-value">{{ item.activeUsers }}</span>
              </div>
              <div class="expanded-row">
                <span class="expanded-label">Avg Duration (sec):</span>
                <span class="expanded-value">{{ item.avgSessionDuration }}</span>
              </div>
              <div class="expanded-row">
                <span class="expanded-label">Engaged Sessions:</span>
                <span class="expanded-value">{{ item.engagedSessions }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Page Hotspots with Expand on Click -->
      <div class="page-hotspots-section" v-if="pageHotspots.length">
        <div class="section-header" @click="showHotspots = !showHotspots">
          <h2>Popular Pages & Content</h2>
          <span class="material-symbols-outlined expand-icon">
            {{ showHotspots ? 'expand_less' : 'expand_more' }}
          </span>
        </div>
        
        <div v-if="showHotspots" class="hotspots-grid">
          <div v-for="(page, index) in topPages" :key="page.pagePath" 
               class="hotspot-card clickable"
               :class="{ 'expanded': expandedPage === page.pagePath }"
               @click="toggleExpandPage(page.pagePath)">
            <div class="hotspot-rank">{{ index + 1 }}</div>
            <div class="hotspot-info">
              <div class="hotspot-title">{{ truncateString(page.pageTitle, 40) || 'Untitled Page' }}</div>
              <div class="hotspot-path">{{ truncateString(page.pagePath, 40) }}</div>
              <div class="hotspot-stats">
                <span class="hotspot-views">{{ formatNumber(page.views) }} views</span>
                <span v-if="enableComparison && page.viewsDelta" class="hotspot-delta" :class="getDeltaClass(page.viewsDelta)">
                  {{ formatDelta(page.viewsDelta) }}
                </span>
              </div>
              
              <!-- Expanded view with full page details -->
              <div v-if="expandedPage === page.pagePath" class="expanded-view">
                <div class="expanded-row">
                  <span class="expanded-label">Full Title:</span>
                  <span class="expanded-value">{{ page.pageTitle || 'Untitled' }}</span>
                </div>
                <div class="expanded-row">
                  <span class="expanded-label">Full Path:</span>
                  <span class="expanded-value">{{ page.pagePath }}</span>
                </div>
                <div class="expanded-row">
                  <span class="expanded-label">Raw Views:</span>
                  <span class="expanded-value">{{ page.views }}</span>
                </div>
                <div v-if="enableComparison && page.viewsDelta" class="expanded-row">
                  <span class="expanded-label">Views Change:</span>
                  <span class="expanded-value">{{ page.viewsDelta }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Basket Size Analysis with Expand on Click -->
      <div class="basket-section" v-if="basketSizeData.length">
        <div class="section-header">
          <h2>Basket Analysis</h2>
        </div>
        <div class="basket-grid">
          <div v-for="item in basketSizeData.slice(0, 5)" :key="item.country" 
               class="basket-card clickable"
               :class="{ 'expanded': expandedBasket === item.country }"
               @click="toggleExpandBasket(item.country)">
            <div class="basket-country">{{ item.country || 'Global' }}</div>
            <div class="basket-metrics">
              <div class="basket-metric">
                <span class="metric-label">Revenue</span>
                <span class="metric-value">{{ formatZAR(item.purchaseRevenue) }}</span>
                <span v-if="enableComparison && item.revenueDelta" class="metric-delta" :class="getDeltaClass(item.revenueDelta)">
                  {{ formatDelta(item.revenueDelta) }}
                </span>
              </div>
              <div class="basket-metric">
                <span class="metric-label">Transactions</span>
                <span class="metric-value">{{ formatNumber(item.transactions) }}</span>
                <span v-if="enableComparison && item.transactionsDelta" class="metric-delta" :class="getDeltaClass(item.transactionsDelta)">
                  {{ formatDelta(item.transactionsDelta) }}
                </span>
              </div>
              <div class="basket-metric">
                <span class="metric-label">Items</span>
                <span class="metric-value">{{ formatNumber(item.itemsPurchased) }}</span>
                <span v-if="enableComparison && item.itemsDelta" class="metric-delta" :class="getDeltaClass(item.itemsDelta)">
                  {{ formatDelta(item.itemsDelta) }}
                </span>
              </div>
              <div class="basket-metric">
                <span class="metric-label">Avg Basket</span>
                <span class="metric-value">{{ item.avgBasketSize?.toFixed(1) || 0 }} items</span>
                <span v-if="enableComparison && item.avgBasketSizeDelta" class="metric-delta" :class="getDeltaClass(item.avgBasketSizeDelta)">
                  {{ formatDelta(item.avgBasketSizeDelta) }}
                </span>
              </div>
              <div class="basket-metric">
                <span class="metric-label">Avg Order</span>
                <span class="metric-value">{{ formatZAR(item.avgRevenuePerTransaction) }}</span>
                <span v-if="enableComparison && item.aovDelta" class="metric-delta" :class="getDeltaClass(item.aovDelta)">
                  {{ formatDelta(item.aovDelta) }}
                </span>
              </div>
            </div>
            
            <!-- Expanded view with raw numbers -->
            <div v-if="expandedBasket === item.country" class="expanded-view">
              <div class="expanded-row">
                <span class="expanded-label">Revenue:</span>
                <span class="expanded-value">{{ item.purchaseRevenue }}</span>
              </div>
              <div class="expanded-row">
                <span class="expanded-label">Transactions:</span>
                <span class="expanded-value">{{ item.transactions }}</span>
              </div>
              <div class="expanded-row">
                <span class="expanded-label">Items:</span>
                <span class="expanded-value">{{ item.itemsPurchased }}</span>
              </div>
              <div class="expanded-row">
                <span class="expanded-label">Avg Basket Size:</span>
                <span class="expanded-value">{{ item.avgBasketSize }}</span>
              </div>
              <div class="expanded-row">
                <span class="expanded-label">Avg Order Value:</span>
                <span class="expanded-value">{{ item.avgRevenuePerTransaction }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Interactive Map with Comparison Toggle -->
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
            
            <div v-if="enableComparison" class="map-view-toggle">
              <button :class="{ active: mapView === 'current' }" @click="mapView = 'current'">Current</button>
              <button :class="{ active: mapView === 'comparison' }" @click="mapView = 'comparison'">Previous</button>
              <button :class="{ active: mapView === 'delta' }" @click="mapView = 'delta'">Change %</button>
            </div>

            <div class="map-legend">
              <span class="legend-item low">Low</span>
              <span class="legend-item medium">Medium</span>
              <span class="legend-item high">High</span>
            </div>
          </div>
        </div>
        
        <div class="map-container">
          <div ref="mapElement" class="leaflet-map"></div>
          
          <div v-if="saCities.length > 0" class="city-markers-panel">
            <h4>Top Cities</h4>
            <div class="city-list">
              <div v-for="city in saCities.slice(0, 5)" :key="city.name" 
                   class="city-marker-item clickable"
                   :class="{ 'expanded': expandedCity === city.name }"
                   @click="toggleExpandCity(city.name)"
                   @mouseenter="highlightCity(city)" 
                   @mouseleave="resetHighlight">
                <span class="city-dot" :style="{ backgroundColor: getCityColor(city) }"></span>
                <span class="city-name">{{ city.name }}</span>
                <div class="city-values">
                  <span class="city-value current">{{ formatCityValue(city, 'current') }}</span>
                  <span v-if="enableComparison" class="city-value comparison">(prev: {{ formatCityValue(city, 'comparison') }})</span>
                  <span v-if="enableComparison" class="city-delta" :class="getDeltaClass(city.delta)">{{ formatDelta(city.delta) }}</span>
                </div>
                
                <!-- Expanded view with city details -->
                <div v-if="expandedCity === city.name" class="expanded-view city-expanded">
                  <div class="expanded-row">
                    <span class="expanded-label">Revenue:</span>
                    <span class="expanded-value">{{ city.revenue }}</span>
                  </div>
                  <div class="expanded-row">
                    <span class="expanded-label">Transactions:</span>
                    <span class="expanded-value">{{ city.transactions }}</span>
                  </div>
                  <div class="expanded-row">
                    <span class="expanded-label">Sessions:</span>
                    <span class="expanded-value">{{ city.sessions }}</span>
                  </div>
                  <div class="expanded-row">
                    <span class="expanded-label">Conv. Rate:</span>
                    <span class="expanded-value">{{ city.conversionRate }}%</span>
                  </div>
                  <div v-if="enableComparison" class="expanded-row">
                    <span class="expanded-label">Prev Revenue:</span>
                    <span class="expanded-value">{{ city.revenueComparison }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Revenue Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Revenue by Location (ZAR)</h3>
            <div class="chart-controls">
              <select v-model="revenueChartMetric" class="chart-select">
                <option value="revenue">Revenue (ZAR)</option>
                <option value="transactions">Transactions</option>
                <option value="conversions">Conversions</option>
              </select>
              
              <div v-if="enableComparison" class="chart-view-toggle">
                <button :class="{ active: revenueChartView === 'sideBySide' }" @click="revenueChartView = 'sideBySide'">Side by Side</button>
                <button :class="{ active: revenueChartView === 'overlay' }" @click="revenueChartView = 'overlay'">Overlay</button>
                <button :class="{ active: revenueChartView === 'delta' }" @click="revenueChartView = 'delta'">Change %</button>
              </div>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>

        <!-- Sessions Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Sessions & Users by Location</h3>
            <div class="chart-controls">
              <select v-model="sessionChartMetric" class="chart-select">
                <option value="sessions">Sessions</option>
                <option value="activeUsers">Active Users</option>
                <option value="newUsers">New Users</option>
                <option value="conversions">Conversions</option>
              </select>
              
              <div v-if="enableComparison" class="chart-view-toggle">
                <button :class="{ active: sessionChartView === 'sideBySide' }" @click="sessionChartView = 'sideBySide'">Side by Side</button>
                <button :class="{ active: sessionChartView === 'overlay' }" @click="sessionChartView = 'overlay'">Overlay</button>
                <button :class="{ active: sessionChartView === 'delta' }" @click="sessionChartView = 'delta'">Change %</button>
              </div>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="sessionChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Detailed Data Tables - Stacked Vertically -->
      <div class="tables-section">
        <div class="section-header" @click="showTables = !showTables">
          <h2>Detailed Data</h2>
          <span class="material-symbols-outlined expand-icon">
            {{ showTables ? 'expand_less' : 'expand_more' }}
          </span>
        </div>
        
        <div v-if="showTables" class="tables-stack">
          <!-- Location Performance Table -->
          <div class="table-card">
            <div class="table-header">
              <h3>Location Performance Details</h3>
              <div class="table-tabs">
                <button :class="{ active: activeLocationTab === 'session' }" @click="activeLocationTab = 'session'">Sessions & Users</button>
                <button :class="{ active: activeLocationTab === 'revenue' }" @click="activeLocationTab = 'revenue'">Revenue (ZAR)</button>
              </div>
            </div>
            
            <div class="table-wrapper">
              <!-- Sessions Table -->
              <table v-if="activeLocationTab === 'session'" class="data-table">
                <thead>
                  <tr class="main-headers">
                    <th rowspan="2">City</th>
                    <th rowspan="2">Country</th>
                    <th :colspan="enableComparison ? 2 : 1">Sessions</th>
                    <th :colspan="enableComparison ? 2 : 1">Conversions</th>
                    <th :colspan="enableComparison ? 2 : 1">Conv. Rate</th>
                    <th :colspan="enableComparison ? 2 : 1">Active Users</th>
                    <th :colspan="enableComparison ? 2 : 1">New Users</th>
                  </tr>
                  <tr class="sub-headers">
                    <template v-if="enableComparison">
                      <th>Value</th>
                      <th>Δ</th>
                      <th>Value</th>
                      <th>Δ</th>
                      <th>Value</th>
                      <th>Δ</th>
                      <th>Value</th>
                      <th>Δ</th>
                      <th>Value</th>
                      <th>Δ</th>
                    </template>
                    <template v-else>
                      <th>Value</th>
                      <th>Value</th>
                      <th>Value</th>
                      <th>Value</th>
                      <th>Value</th>
                    </template>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in locationSessionData.slice(0, 10)" :key="item.city + item.country">
                    <td class="city-cell">{{ item.city || '—' }}</td>
                    <td class="country-cell">{{ item.country || '—' }}</td>
                    <td class="value-cell">{{ formatNumber(item.sessions) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.sessionsDelta)">{{ formatDelta(item.sessionsDelta) }}</span>
                    </td>
                    <td class="value-cell">{{ formatNumber(item.conversions) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.conversionsDelta)">{{ formatDelta(item.conversionsDelta) }}</span>
                    </td>
                    <td class="value-cell">{{ formatPercent(item.sessionConversionRate) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.conversionRateDelta)">{{ formatDelta(item.conversionRateDelta) }}</span>
                    </td>
                    <td class="value-cell">{{ formatNumber(item.activeUsers) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.activeUsersDelta)">{{ formatDelta(item.activeUsersDelta) }}</span>
                    </td>
                    <td class="value-cell">{{ formatNumber(item.newUsers) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.newUsersDelta)">{{ formatDelta(item.newUsersDelta) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Revenue Table -->
              <table v-else class="data-table">
                <thead>
                  <tr class="main-headers">
                    <th rowspan="2">City</th>
                    <th rowspan="2">Country</th>
                    <th :colspan="enableComparison ? 2 : 1">Revenue (ZAR)</th>
                    <th :colspan="enableComparison ? 2 : 1">Transactions</th>
                    <th :colspan="enableComparison ? 2 : 1">Conversions</th>
                    <th :colspan="enableComparison ? 2 : 1">Avg. Order Value</th>
                  </tr>
                  <tr class="sub-headers">
                    <template v-if="enableComparison">
                      <th>Value</th>
                      <th>Δ</th>
                      <th>Value</th>
                      <th>Δ</th>
                      <th>Value</th>
                      <th>Δ</th>
                      <th>Value</th>
                      <th>Δ</th>
                    </template>
                    <template v-else>
                      <th>Value</th>
                      <th>Value</th>
                      <th>Value</th>
                      <th>Value</th>
                    </template>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in locationRevenueData.slice(0, 10)" :key="item.city + item.country">
                    <td class="city-cell">{{ item.city || '—' }}</td>
                    <td class="country-cell">{{ item.country || '—' }}</td>
                    <td class="value-cell">{{ formatZAR(item.purchaseRevenue) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.revenueDelta)">{{ formatDelta(item.revenueDelta) }}</span>
                    </td>
                    <td class="value-cell">{{ formatNumber(item.transactions) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.transactionsDelta)">{{ formatDelta(item.transactionsDelta) }}</span>
                    </td>
                    <td class="value-cell">{{ formatNumber(item.conversions) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.conversionsDelta)">{{ formatDelta(item.conversionsDelta) }}</span>
                    </td>
                    <td class="value-cell">{{ formatZAR(item.transactions ? item.purchaseRevenue / item.transactions : 0) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.aovDelta)">{{ formatDelta(item.aovDelta) }}</span>
                    </td>
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
                    <th rowspan="2">Channel</th>
                    <th rowspan="2">Device</th>
                    <th rowspan="2">Campaign</th>
                    <th :colspan="enableComparison ? 2 : 1">Sessions</th>
                    <th :colspan="enableComparison ? 2 : 1">Conversions</th>
                    <th :colspan="enableComparison ? 2 : 1">Conv. Rate</th>
                  </tr>
                  <tr class="sub-headers">
                    <template v-if="enableComparison">
                      <th>Value</th>
                      <th>Δ</th>
                      <th>Value</th>
                      <th>Δ</th>
                      <th>Value</th>
                      <th>Δ</th>
                    </template>
                    <template v-else>
                      <th>Value</th>
                      <th>Value</th>
                      <th>Value</th>
                    </template>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in sourceData.slice(0, 8)" :key="item.channel + item.deviceCategory + item.campaignName">
                    <td><span class="channel-badge" :class="getChannelClass(item.channel)">{{ item.channel || 'Other' }}</span></td>
                    <td><span class="device-badge">{{ item.deviceCategory || '—' }}</span></td>
                    <td class="campaign-cell">{{ truncateString(item.campaignName, 20) || '—' }}</td>
                    <td class="value-cell">{{ formatNumber(item.sessions) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.sessionsDelta)">{{ formatDelta(item.sessionsDelta) }}</span>
                    </td>
                    <td class="value-cell">{{ formatNumber(item.conversions) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.conversionsDelta)">{{ formatDelta(item.conversionsDelta) }}</span>
                    </td>
                    <td class="value-cell">{{ formatPercent(item.sessionConversionRate) }}</td>
                    <td v-if="enableComparison" class="delta-cell">
                      <span class="delta-value" :class="getDeltaClass(item.conversionRateDelta)">{{ formatDelta(item.conversionRateDelta) }}</span>
                    </td>
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
    // ==================== CONSTANTS ====================
    // const API_BASE = 'https://google-analytics-api-1.onrender.com'
    const API_BASE = 'http://localhost:3001'
    
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

    const CHART_COLORS = {
      primary: 'rgba(59, 130, 246, 0.8)',
      secondary: 'rgba(156, 163, 175, 0.6)',
      success: 'rgba(16, 185, 129, 0.8)',
      danger: 'rgba(239, 68, 68, 0.8)',
      warning: 'rgba(245, 158, 11, 0.8)'
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
    
    // Expanded state for click-to-expand
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

    // Data containers - All server endpoints
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

    // Map refs
    const mapElement = ref(null)
    let map = null
    let markers = []
    let highlightedMarker = null
    let L = null

    // Chart refs
    const revenueChart = ref(null)
    const sessionChart = ref(null)
    let revenueChartInstance = null
    let sessionChartInstance = null

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

    // ==================== UTILITIES ====================
    const formatters = {
      zar: (value) => {
        if (value === null || value === undefined || isNaN(value)) return 'R0'
        return new Intl.NumberFormat('en-ZA', { 
          style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(value)
      },
      number: (value) => {
        if (value === null || value === undefined || isNaN(value)) return '0'
        return new Intl.NumberFormat('en-ZA').format(value)
      },
      percent: (value) => {
        if (value === null || value === undefined || isNaN(value)) return '0%'
        return new Intl.NumberFormat('en-ZA', { 
          style: 'percent', minimumFractionDigits: 1 
        }).format(value / 100)
      },
      truncate: (str, maxLength) => {
        if (!str) return str
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
      },
      delta: (value) => {
        if (value === null || value === undefined || isNaN(value)) return '—'
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

    const getChannelClass = (channel) => {
      if (!channel) return 'other'
      const channelLower = channel.toLowerCase()
      if (channelLower.includes('organic')) return 'organic'
      if (channelLower.includes('paid')) return 'paid'
      if (channelLower.includes('direct')) return 'direct'
      if (channelLower.includes('referral')) return 'referral'
      if (channelLower.includes('social')) return 'social'
      return 'other'
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
      if (!previous || previous === 0 || !current) return null
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

      // Basket size KPI
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
        { 
          label: 'Total Revenue', 
          value: totals.revenue, 
          rawValue: totals.revenue,
          compValue: comparisonTotals.revenue,
          rawComparison: comparisonTotals.revenue,
          formatter: formatZAR, 
          icon: 'trending_up', 
          color: '#10b981' 
        },
        { 
          label: 'Transactions', 
          value: totals.transactions, 
          rawValue: totals.transactions,
          compValue: comparisonTotals.transactions,
          rawComparison: comparisonTotals.transactions,
          formatter: formatNumber, 
          icon: 'shopping_cart', 
          color: '#3b82f6' 
        },
        { 
          label: 'Sessions', 
          value: totals.sessions, 
          rawValue: totals.sessions,
          compValue: comparisonTotals.sessions,
          rawComparison: comparisonTotals.sessions,
          formatter: formatNumber, 
          icon: 'visibility', 
          color: '#f59e0b' 
        },
        { 
          label: 'Conversions', 
          value: totalConversions, 
          rawValue: totalConversions,
          compValue: comparisonTotals.conversions,
          rawComparison: comparisonTotals.conversions,
          formatter: formatNumber, 
          icon: 'conversion_path', 
          color: '#8b5cf6' 
        },
        { 
          label: 'Avg. Conv. Rate', 
          value: avgConversionRate, 
          rawValue: avgConversionRate,
          compValue: comparisonTotals.conversionRate,
          rawComparison: comparisonTotals.conversionRate,
          formatter: formatPercent, 
          icon: 'percent', 
          color: '#ec4899' 
        },
        { 
          label: 'Avg. Basket Size', 
          value: avgBasketSize, 
          rawValue: avgBasketSize,
          compValue: comparisonTotals.basketSize,
          rawComparison: comparisonTotals.basketSize,
          formatter: formatZAR, 
          icon: 'shopping_basket', 
          color: '#f97316' 
        }
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
             basketSizeData.value.length > 0
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

    const processSessionData = (current, comparison) => {
      return current.map(item => {
        const comp = comparison.find(c => c.city === item.city && c.country === item.country) || {}
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
        const comp = comparison.find(c => c.city === item.city && c.country === item.country) || {}
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
      return current.map(item => {
        const comp = comparison.find(c => 
          c.channel === item.channel && 
          c.deviceCategory === item.deviceCategory &&
          c.campaignName === item.campaignName
        ) || {}
        
        return {
          ...item,
          sessionsDelta: calculateDelta(item.sessions, comp.sessions),
          conversionsDelta: calculateDelta(item.conversions, comp.conversions),
          conversionRateDelta: calculateDelta(item.sessionConversionRate, comp.sessionConversionRate)
        }
      })
    }

    const processEngagementData = (current, comparison) => {
      return current.map(item => {
        const comp = comparison.find(c => c.deviceCategory === item.deviceCategory) || {}
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
      return current.map(item => {
        const comp = comparison.find(c => c.pagePath === item.pagePath) || {}
        return {
          ...item,
          viewsDelta: calculateDelta(item.views, comp.views)
        }
      })
    }

    const processBasketSizeData = (current, comparison) => {
      return current.map(item => {
        const comp = comparison.find(c => c.country === item.country) || {}
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
          basketResponse
        ] = await Promise.all([
          fetchData('/analytics/conversions-by-location'),
          fetchData('/analytics/revenue-by-location'),
          fetchData('/analytics/conversions-by-source'),
          fetchData('/analytics/engagement'),
          fetchData('/analytics/page-hotspots'),
          fetchData('/analytics/basket-size')
        ])
        
        // Store comparison data
        locationSessionComparison.value = sessionResponse.comparisonPeriod || []
        locationRevenueComparison.value = revenueResponse.comparisonPeriod || []
        sourceComparison.value = sourceResponse.comparisonPeriod || []
        engagementComparison.value = engagementResponse.comparisonPeriod || []
        pageHotspotsComparison.value = pageResponse.comparisonPeriod || []
        basketSizeComparison.value = basketResponse.comparisonPeriod || []
        
        // Process current data with deltas
        locationSessionData.value = processSessionData(sessionResponse.currentPeriod || [], locationSessionComparison.value)
        locationRevenueData.value = processRevenueData(revenueResponse.currentPeriod || [], locationRevenueComparison.value)
        sourceData.value = processSourceData(sourceResponse.currentPeriod || [], sourceComparison.value)
        engagementData.value = processEngagementData(engagementResponse.currentPeriod || [], engagementComparison.value)
        pageHotspots.value = processPageHotspots(pageResponse.currentPeriod || [], pageHotspotsComparison.value)
        basketSizeData.value = processBasketSizeData(basketResponse.currentPeriod || [], basketSizeComparison.value)
        
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        loading.value = false
        await nextTick()
        updateRevenueChart()
        updateSessionChart()
        
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
    const initMap = async () => {
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
          attribution: '© OpenStreetMap contributors', maxZoom: 18
        }).addTo(map)
        
        map.whenReady(() => setTimeout(() => map.invalidateSize(), 100))
        updateMapMarkers()
      } catch (error) {
        console.error('Failed to load map:', error)
      }
    }

    const getCityMetricValue = (city, view = mapView.value) => {
      if (view === 'current') {
        return city[mapMetric.value] || city.revenue
      } else if (view === 'comparison') {
        const metricMap = { 
          revenue: city.revenueComparison, 
          transactions: city.transactionsComparison, 
          sessions: city.sessionsComparison, 
          conversionRate: city.conversionRateComparison,
          conversions: city.conversionsComparison
        }
        return metricMap[mapMetric.value] || city.revenueComparison
      }
      return city.delta || 0
    }

    const getCityComparisonValue = (city) => {
      const metricMap = { 
        revenue: city.revenueComparison, 
        transactions: city.transactionsComparison, 
        sessions: city.sessionsComparison, 
        conversionRate: city.conversionRateComparison,
        conversions: city.conversionsComparison
      }
      return metricMap[mapMetric.value] || city.revenueComparison
    }

    const getMetricColor = (value, maxValue, isDelta = false) => {
      if (isDelta) {
        if (value > 20) return '#10b981'
        if (value > 5) return '#84cc16'
        if (value > -5) return '#f59e0b'
        if (value > -20) return '#f97316'
        return '#ef4444'
      }
      const normalized = value / maxValue
      if (normalized > 0.66) return '#ef4444'
      if (normalized > 0.33) return '#f59e0b'
      return '#10b981'
    }

    const updateMapMarkers = () => {
      if (!map || !L || !saCities.value.length) return
      
      markers.forEach(marker => map.removeLayer(marker))
      markers = []
      
      const isDelta = mapView.value === 'delta'
      const values = saCities.value.map(city => getCityMetricValue(city))
      const maxValue = isDelta ? Math.max(...values.map(Math.abs), 1) : Math.max(...values, 1)
      
      saCities.value.forEach(city => {
        const value = getCityMetricValue(city)
        const color = getMetricColor(value, maxValue, isDelta)
        const radius = isDelta ? 10 + (Math.abs(value) / maxValue) * 10 : 8 + (12 * (value / maxValue))
        
        const circle = L.circleMarker([city.lat, city.lng], {
          radius, fillColor: color, color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 0.8
        })
        
        circle.bindPopup(`
          <div class="map-popup">
            <strong>${city.name}</strong><br>
            Current Revenue: ${formatZAR(city.revenue)}<br>
            ${enableComparison.value ? `Previous Revenue: ${formatZAR(city.revenueComparison)}<br>` : ''}
            Transactions: ${formatNumber(city.transactions)}<br>
            Conversions: ${formatNumber(city.conversions)}<br>
            Sessions: ${formatNumber(city.sessions)}<br>
            Conv. Rate: ${formatPercent(city.conversionRate)}<br>
            ${enableComparison.value ? `Change: ${formatDelta(city.delta)}` : ''}
          </div>
        `)
        
        circle.addTo(map)
        markers.push(circle)
      })
    }

    const getCityColor = (city) => {
      const isDelta = mapView.value === 'delta'
      const values = saCities.value.map(c => getCityMetricValue(c))
      const maxValue = isDelta ? Math.max(...values.map(Math.abs), 1) : Math.max(...values, 1)
      return getMetricColor(getCityMetricValue(city), maxValue, isDelta)
    }

    const formatCityValue = (city, view = 'current') => {
      const value = getCityMetricValue(city, view)
      
      if (mapView.value === 'delta') return formatDelta(value)
      
      const formatMap = {
        revenue: formatZAR,
        transactions: formatNumber,
        sessions: formatNumber,
        conversionRate: formatPercent,
        conversions: formatNumber
      }
      return formatMap[mapMetric.value]?.(value) || formatZAR(value)
    }

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

    const zoomToCity = (city) => {
      if (!map) return
      map.setView([city.lat, city.lng], 10)
      highlightCity(city)
    }

    // ==================== CHART FUNCTIONS ====================
    const createChartConfig = (type, labels, datasets, options = {}) => ({
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
                const formatted = ctx.dataset.formatter ? ctx.dataset.formatter(value) : value
                return `${label}: ${formatted}`
              }
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: '#e5e7eb' },
            ticks: { callback: (value) => options.yFormatter ? options.yFormatter(value) : value }
          },
          x: { grid: { display: false } }
        },
        ...options
      }
    })

    const updateRevenueChart = () => {
      if (!revenueChart.value || !locationRevenueData.value.length) return
      if (revenueChartInstance) revenueChartInstance.destroy()
      
      const topLocations = locationRevenueData.value.slice(0, 8)
      const labels = topLocations.map(item => item.city || 'Unknown')
      
      let datasets = []
      
      if (enableComparison.value && revenueChartView.value === 'sideBySide') {
        datasets = [
          {
            label: 'Current Period',
            data: topLocations.map(item => {
              if (revenueChartMetric.value === 'revenue') return item.purchaseRevenue
              if (revenueChartMetric.value === 'transactions') return item.transactions
              return item.conversions
            }),
            backgroundColor: CHART_COLORS.primary,
            borderRadius: 8
          },
          {
            label: 'Comparison Period',
            data: topLocations.map(item => {
              const comparison = locationRevenueComparison.value.find(c => c.city === item.city) || {}
              if (revenueChartMetric.value === 'revenue') return comparison.purchaseRevenue || 0
              if (revenueChartMetric.value === 'transactions') return comparison.transactions || 0
              return comparison.conversions || 0
            }),
            backgroundColor: CHART_COLORS.secondary,
            borderRadius: 8
          }
        ]
      } else if (enableComparison.value && revenueChartView.value === 'delta') {
        datasets = [{
          label: 'Change %',
          data: topLocations.map(item => item.revenueDelta || 0),
          backgroundColor: topLocations.map(item => 
            (item.revenueDelta || 0) > 0 ? CHART_COLORS.success : CHART_COLORS.danger
          ),
          borderRadius: 8,
          formatter: formatDelta
        }]
      } else {
        datasets = [{
          label: revenueChartMetric.value === 'revenue' ? 'Revenue (ZAR)' : 
                 revenueChartMetric.value === 'transactions' ? 'Transactions' : 'Conversions',
          data: topLocations.map(item => {
            if (revenueChartMetric.value === 'revenue') return item.purchaseRevenue
            if (revenueChartMetric.value === 'transactions') return item.transactions
            return item.conversions
          }),
          backgroundColor: CHART_COLORS.primary,
          borderRadius: 8
        }]
      }
      
      const formatter = revenueChartMetric.value === 'revenue' ? formatZAR : formatNumber
      revenueChartInstance = new Chart(revenueChart.value, createChartConfig('bar', labels, datasets, { yFormatter: formatter }))
    }

    const updateSessionChart = () => {
      if (!sessionChart.value || !locationSessionData.value.length) return
      if (sessionChartInstance) sessionChartInstance.destroy()
      
      const topLocations = locationSessionData.value.slice(0, 8)
      const labels = topLocations.map(item => item.city || 'Unknown')
      const metricLabels = { 
        sessions: 'Sessions', 
        activeUsers: 'Active Users', 
        newUsers: 'New Users', 
        conversions: 'Conversions' 
      }
      
      let datasets = []
      
      if (enableComparison.value && sessionChartView.value === 'sideBySide') {
        datasets = [
          {
            label: 'Current Period',
            data: topLocations.map(item => item[sessionChartMetric.value] || 0),
            backgroundColor: CHART_COLORS.success,
            borderRadius: 8
          },
          {
            label: 'Comparison Period',
            data: topLocations.map(item => {
              const comparison = locationSessionComparison.value.find(c => c.city === item.city) || {}
              return comparison[sessionChartMetric.value] || 0
            }),
            backgroundColor: CHART_COLORS.secondary,
            borderRadius: 8
          }
        ]
      } else if (enableComparison.value && sessionChartView.value === 'delta') {
        const deltaField = sessionChartMetric.value === 'sessions' ? 'sessionsDelta' :
                          sessionChartMetric.value === 'activeUsers' ? 'activeUsersDelta' :
                          sessionChartMetric.value === 'newUsers' ? 'newUsersDelta' : 'conversionsDelta'
        
        datasets = [{
          label: 'Change %',
          data: topLocations.map(item => item[deltaField] || 0),
          backgroundColor: topLocations.map(item => 
            (item[deltaField] || 0) > 0 ? CHART_COLORS.success : CHART_COLORS.danger
          ),
          borderRadius: 8,
          formatter: formatDelta
        }]
      } else {
        datasets = [{
          label: metricLabels[sessionChartMetric.value] || 'Sessions',
          data: topLocations.map(item => item[sessionChartMetric.value] || 0),
          backgroundColor: CHART_COLORS.success,
          borderRadius: 8
        }]
      }
      
      sessionChartInstance = new Chart(sessionChart.value, createChartConfig('bar', labels, datasets, { yFormatter: formatNumber }))
    }

    // ==================== WATCHERS ====================
    watch(revenueChartMetric, () => !loading.value && locationRevenueData.value.length && nextTick(updateRevenueChart))
    watch(sessionChartMetric, () => !loading.value && locationSessionData.value.length && nextTick(updateSessionChart))
    watch(revenueChartView, () => !loading.value && locationRevenueData.value.length && nextTick(updateRevenueChart))
    watch(sessionChartView, () => !loading.value && locationSessionData.value.length && nextTick(updateSessionChart))
    watch(enableComparison, () => {
      if (!loading.value) {
        nextTick(() => {
          updateRevenueChart()
          updateSessionChart()
          if (map) updateMapMarkers()
        })
      }
    })
    watch(mapView, () => !loading.value && map && updateMapMarkers())
    watch(mapMetric, () => !loading.value && map && updateMapMarkers())
    watch([locationRevenueData, locationSessionData], () => {
      if (!loading.value && map) nextTick(updateMapMarkers)
    }, { deep: true })

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
      topPages,
      mapElement, 
      revenueChart, 
      sessionChart,
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
      getChannelClass, 
      highlightCity, 
      resetHighlight, 
      zoomToCity,
      getCityColor, 
      formatCityValue,
      getCityComparisonValue
    }
  }
}
</script>

<style>
/* Import Leaflet CSS */
@import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0,1');

/* ==================== CSS Variables ==================== */
:root {
  /* Colors */
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --success: #10b981;
  --success-dark: #059669;
  --warning: #f59e0b;
  --danger: #ef4444;
  --purple: #8b5cf6;
  --pink: #ec4899;
  --orange: #f97316;
  
  /* Grays */
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
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}

/* ==================== Base Styles ==================== */
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

/* ==================== Layout Components ==================== */
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

/* ==================== Cards ==================== */
.date-range-card,
.map-section,
.chart-card,
.tables-section,
.kpi-card,
.table-card,
.skeleton-card,
.engagement-card,
.hotspot-card,
.basket-card {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
}

/* Clickable cards with expand functionality */
.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.clickable.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
  position: relative;
  z-index: 5;
}

/* ==================== Date Range & Controls ==================== */
.date-range-card {
  max-width: 1400px;
  margin: var(--space-6) auto 0;
  padding: var(--space-6);
  box-shadow: var(--shadow-xl);
}

.date-inputs {
  display: flex;
  gap: var(--space-8);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}

.period-inputs {
  flex: 1;
  min-width: 300px;
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
}

.period-inputs.comparison {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
}

.period-title {
  width: 100%;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: var(--space-2);
}

.controls-group {
  min-width: 250px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-600);
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-picker,
.quick-select-dropdown {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  width: 100%;
  transition: border-color 0.2s;
  font-family: 'Inter', sans-serif;
}

.date-picker {
  padding-left: 2.5rem;
}

.date-picker:focus,
.quick-select-dropdown:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-icon {
  position: absolute;
  left: var(--space-3);
  color: var(--gray-400);
  font-size: 1.25rem;
  pointer-events: none;
}

/* Toggle Switch */
.toggle-group {
  display: flex;
  align-items: center;
}

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-slider {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  background-color: var(--gray-200);
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: var(--shadow-sm);
}

input:checked + .toggle-slider {
  background-color: var(--primary);
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-600);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.export-btn,
.update-btn {
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 42px;
}

.export-btn {
  background: var(--success);
  color: white;
}

.export-btn:hover:not(:disabled) {
  background: var(--success-dark);
}

.update-btn {
  background: var(--primary);
  color: white;
  min-width: 160px;
}

.update-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.export-btn:disabled,
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

/* ==================== KPI Cards ==================== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.kpi-card {
  padding: var(--space-6);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.kpi-card.comparison-card {
  padding-bottom: var(--space-4);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.kpi-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon .material-symbols-outlined {
  font-size: 24px;
}

.kpi-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.kpi-label {
  display: block;
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comparison-values {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: 0.75rem;
  margin-top: var(--space-1);
}

.comparison-label {
  color: var(--gray-500);
}

.comparison-value {
  font-weight: 600;
  color: var(--gray-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.kpi-trend {
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
  margin-top: var(--space-1);
}

.kpi-trend.positive {
  color: var(--success);
}

.kpi-trend.negative {
  color: var(--danger);
}

/* Expanded View */
.expanded-view {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--gray-300);
  animation: slideDown 0.2s ease-out;
}

.city-expanded {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid var(--primary);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  z-index: 10;
  box-shadow: var(--shadow-lg);
}

.expanded-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-1) 0;
  font-size: 0.875rem;
  gap: var(--space-2);
}

.expanded-label {
  color: var(--gray-500);
  font-weight: 500;
}

.expanded-value {
  font-family: 'Inter', monospace;
  font-weight: 600;
  color: var(--gray-800);
  word-break: break-all;
  text-align: right;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== Engagement Section ==================== */
.engagement-section,
.page-hotspots-section,
.basket-section {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-md);
}

.engagement-header,
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  cursor: pointer;
}

.engagement-header h2,
.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.engagement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-4);
}

.engagement-card {
  padding: var(--space-4);
  background: var(--gray-50);
  position: relative;
}

.engagement-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
}

.engagement-type {
  margin-bottom: var(--space-3);
}

.device-type-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.device-type-badge.mobile { background: #dbeafe; color: #1e40af; }
.device-type-badge.desktop { background: #dcfce7; color: #166534; }
.device-type-badge.tablet { background: #fef3c7; color: #92400e; }

.engagement-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-delta {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
  display: inline-block;
  width: fit-content;
}

/* ==================== Page Hotspots ==================== */
.hotspots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.hotspot-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--gray-50);
  transition: transform 0.2s;
  min-width: 0;
  position: relative;
}

.hotspot-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
}

.hotspot-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.hotspot-rank {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.hotspot-info {
  flex: 1;
  min-width: 0;
}

.hotspot-title {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hotspot-path {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-bottom: var(--space-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hotspot-stats {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.hotspot-views {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  white-space: nowrap;
}

.hotspot-delta {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
}

/* ==================== Basket Analysis ==================== */
.basket-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.basket-card {
  padding: var(--space-4);
  background: var(--gray-50);
  position: relative;
}

.basket-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
}

.basket-country {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--gray-200);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.basket-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.basket-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-width: 0;
}

.metric-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  white-space: nowrap;
}

.metric-value {
  font-weight: 600;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.metric-delta {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
}

/* ==================== Map Section ==================== */
.map-section {
  padding: var(--space-6);
  margin-bottom: var(--space-8);
}

.map-controls {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  flex-wrap: wrap;
}

.map-select {
  padding: var(--space-2);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--gray-600);
  background: white;
  cursor: pointer;
}

.map-view-toggle,
.chart-view-toggle {
  display: flex;
  gap: var(--space-1);
  background: var(--gray-100);
  padding: var(--space-1);
  border-radius: var(--radius-lg);
}

.map-view-toggle button,
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

.map-view-toggle button.active,
.chart-view-toggle button.active {
  background: white;
  color: var(--gray-800);
  box-shadow: var(--shadow-sm);
}

.map-legend {
  display: flex;
  gap: var(--space-4);
  font-size: 0.75rem;
}

.legend-item {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  color: white;
}

.legend-item.low { background: var(--success); }
.legend-item.medium { background: var(--warning); }
.legend-item.high { background: var(--danger); }

.map-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-4);
  height: 500px;
}

.leaflet-map {
  height: 100%;
  width: 100%;
  border-radius: var(--radius-xl);
  z-index: 1;
  background: #f8fafc;
}

/* City Markers Panel */
.city-markers-panel {
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  overflow-y: auto;
}

.city-markers-panel h4 {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--gray-200);
}

.city-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.city-marker-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  min-width: 0;
  position: relative;
}

.city-marker-item.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
}

.city-marker-item:hover {
  border-color: var(--primary);
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
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
  font-weight: 600;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.city-values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  min-width: 0;
}

.city-value {
  font-size: 0.75rem;
  color: var(--gray-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.city-value.current {
  font-weight: 600;
  color: var(--gray-800);
}

.city-value.comparison {
  font-size: 0.7rem;
  color: var(--gray-400);
}

/* Map Popup */
.map-popup {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  line-height: 1.6;
  min-width: 180px;
}

.map-popup strong {
  color: var(--gray-800);
  display: block;
  margin-bottom: var(--space-2);
  font-size: 0.875rem;
}

/* ==================== Charts ==================== */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.chart-card {
  padding: var(--space-6);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-4);
}

.chart-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
}

.chart-controls {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
}

.chart-select {
  padding: var(--space-2);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--gray-600);
  background: white;
  cursor: pointer;
}

.chart-container {
  height: 300px;
  position: relative;
}

/* ==================== Tables Section ==================== */
.tables-section {
  padding: var(--space-6);
}

.expand-icon {
  color: var(--gray-500);
}

/* Stacked Tables Layout */
.tables-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-top: var(--space-6);
}

/* Table Card */
.table-card {
  background: var(--gray-50);
  padding: var(--space-6);
  width: 100%;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}

.table-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
}

.table-tabs {
  display: flex;
  gap: var(--space-2);
  background: white;
  padding: var(--space-1);
  border-radius: var(--radius-lg);
}

.table-tabs button {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s;
}

.table-tabs button.active {
  background: var(--primary);
  color: white;
}

.table-wrapper {
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
  border-radius: var(--radius-lg);
  scrollbar-width: thin;
  scrollbar-color: var(--gray-300) var(--gray-100);
}

.table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-sm);
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-sm);
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* ==================== Table Styles ==================== */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: white;
  min-width: 1000px;
  table-layout: fixed;
}

/* Header Styles */
.data-table th {
  padding: var(--space-3) var(--space-2);
  background: var(--gray-100);
  color: var(--gray-600);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--gray-200);
  white-space: nowrap;
  text-align: center;
  vertical-align: middle;
}

.data-table .main-headers th {
  background: var(--gray-100);
}

.data-table .sub-headers th {
  background: var(--gray-50);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--gray-500);
  border-bottom: 1px solid var(--gray-200);
  padding: var(--space-2) var(--space-1);
  text-align: center;
}

/* Cell Styles */
.data-table td {
  padding: var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--gray-200);
  color: var(--gray-800);
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
}

.data-table td:first-child,
.data-table td:nth-child(2) {
  text-align: left;
}

.data-table tbody tr:hover td {
  background: var(--gray-50);
}

.data-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

/* Column Widths */
.data-table th:nth-child(1),
.data-table td:nth-child(1) { 
  width: 100px; 
  text-align: left;
}

.data-table th:nth-child(2),
.data-table td:nth-child(2) { 
  width: 100px; 
  text-align: left;
}

/* Value and Delta cells */
.data-table .value-cell {
  font-family: 'Inter', monospace;
  font-weight: 500;
  text-align: right;
  min-width: 80px;
}

.data-table .delta-cell {
  text-align: center;
  min-width: 60px;
}

/* Special Cell Types */
.data-table .city-cell,
.data-table .country-cell {
  font-weight: 500;
  text-align: left;
  padding-left: var(--space-3);
}

.data-table .city-cell {
  font-weight: 600;
  color: var(--gray-800);
}

.data-table .country-cell {
  color: var(--gray-500);
}

.data-table .campaign-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--gray-600);
  text-align: left;
}

/* Sticky Headers */
.data-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table .main-headers th {
  position: sticky;
  top: 0;
  z-index: 20;
}

.data-table .sub-headers th {
  position: sticky;
  top: 41px;
  z-index: 15;
}

/* Spanning Header Style */
.data-table .sub-headers th[colspan] {
  text-align: center;
  background: var(--gray-50);
}

/* ==================== Badges & Deltas ==================== */
.delta-badge,
.delta-value,
.city-delta,
.stat-delta,
.hotspot-delta,
.metric-delta {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
  white-space: nowrap;
}

.delta-badge,
.city-delta {
  border-radius: var(--radius-full);
}

.delta-value {
  min-width: 60px;
}

.delta-badge.positive,
.delta-value.positive,
.city-delta.positive,
.stat-delta.positive,
.hotspot-delta.positive,
.metric-delta.positive {
  background: #d1fae5;
  color: #065f46;
}

.delta-badge.negative,
.delta-value.negative,
.city-delta.negative,
.stat-delta.negative,
.hotspot-delta.negative,
.metric-delta.negative {
  background: #fee2e2;
  color: #991b1b;
}

.delta-badge.neutral,
.delta-value.neutral,
.city-delta.neutral,
.stat-delta.neutral,
.hotspot-delta.neutral,
.metric-delta.neutral {
  background: var(--gray-100);
  color: var(--gray-600);
}

/* Channel Badges */
.channel-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-badge.organic { background: #dbeafe; color: #1e40af; }
.channel-badge.paid { background: #fee2e2; color: #991b1b; }
.channel-badge.direct { background: #dcfce7; color: #166534; }
.channel-badge.referral { background: #fef3c7; color: #92400e; }
.channel-badge.social { background: #f3e8ff; color: #6b21a8; }
.channel-badge.other { background: var(--gray-100); color: var(--gray-600); }

.device-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background: var(--gray-100);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  color: var(--gray-600);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== Loading Skeleton ==================== */
.loading-skeleton {
  max-width: 1400px;
  margin: var(--space-8) auto;
  padding: 0 var(--space-8);
}

.skeleton-card {
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

/* ==================== Responsive Design ==================== */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .map-container {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .city-markers-panel {
    max-height: 300px;
  }
  
  .engagement-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .map-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .data-table {
    font-size: 0.8rem;
  }
  
  .data-table th,
  .data-table td {
    padding: var(--space-2) var(--space-1);
  }
  
  .data-table .value-cell,
  .data-table .delta-cell {
    min-width: 60px;
  }
  
  .delta-value {
    padding: 0.125rem var(--space-1);
    min-width: 50px;
    font-size: 0.7rem;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: var(--space-6) var(--space-6) 2.5rem;
  }
  
  .dashboard-content {
    padding: 0 var(--space-4);
  }
  
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  
  .date-inputs {
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .period-inputs {
    min-width: 100%;
  }
  
  .controls-group {
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .export-btn,
  .update-btn {
    width: 100%;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .chart-controls {
    width: 100%;
  }
  
  .chart-select {
    flex: 1;
  }
  
  .hotspots-grid {
    grid-template-columns: 1fr;
  }
  
  .basket-grid {
    grid-template-columns: 1fr;
  }
  
  .engagement-stats {
    grid-template-columns: 1fr;
  }
}

/* Hide old grid layout */
.tables-grid {
  display: none;
}
</style>