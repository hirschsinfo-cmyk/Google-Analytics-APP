import { ref } from 'vue'

export function useAnalytics(API_BASE) {
  const loading = ref(false)
  const error = ref(null)

  // Generic fetch function with error handling
  async function fetchData(endpoint, params = {}) {
    loading.value = true
    error.value = null
    
    try {
      const url = new URL(`${API_BASE}${endpoint}`)
      
      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value)
        }
      })
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (err) {
      error.value = err.message
      console.error(`Failed to fetch ${endpoint}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Analytics-specific endpoints
  const analytics = {
    // Get conversion data by location
    async getConversionsByLocation(startDate, endDate) {
      return fetchData('/analytics/conversions-by-location', {
        startDate,
        endDate
      })
    },

    // Get revenue data by location
    async getRevenueByLocation(startDate, endDate) {
      return fetchData('/analytics/revenue-by-location', {
        startDate,
        endDate
      })
    },

    // Get source/medium data
    async getConversionsBySource(startDate, endDate) {
      return fetchData('/analytics/conversions-by-source', {
        startDate,
        endDate
      })
    },

    // Get all analytics data in parallel
    async getAllData(startDate, endDate) {
      loading.value = true
      error.value = null
      
      try {
        const [sessionData, revenueData, sourceData] = await Promise.all([
          this.getConversionsByLocation(startDate, endDate),
          this.getRevenueByLocation(startDate, endDate),
          this.getConversionsBySource(startDate, endDate)
        ])
        
        return {
          sessionData,
          revenueData,
          sourceData
        }
      } catch (err) {
        error.value = err.message
        throw err
      } finally {
        loading.value = false
      }
    },

    // Get data with date range validation
    async getDataWithValidation(startDate, endDate) {
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required')
      }
      
      return this.getAllData(startDate, endDate)
    }
  }

  return {
    ...analytics,
    loading: readonly(loading),
    error: readonly(error)
  }
}

// Helper to make refs readonly
function readonly(ref) {
  return ref
}