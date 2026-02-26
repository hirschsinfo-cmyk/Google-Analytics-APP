import { ref } from 'vue'

export function useMap(saCities, mapMetric, formatters) {
  const mapElement = ref(null)
  const mapReady = ref(false)
  let map = null
  let markers = []
  let highlightedMarker = null
  let L = null

  async function initMap() {
    if (!mapElement.value || map) return
    
    try {
      const leaflet = await import('leaflet')
      L = leaflet.default || leaflet
      
      // Fix marker icons
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
      
      mapReady.value = true
      
      map.whenReady(() => {
        setTimeout(() => map.invalidateSize(), 100)
      })
      
      updateMapMarkers()
    } catch (error) {
      console.error('Failed to load map:', error)
    }
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
        radius,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      })
      
      circle.bindPopup(`
        <div class="map-popup">
          <strong>${city.name}</strong><br>
          Revenue: ${formatters.currency(city.revenue)}<br>
          Transactions: ${formatters.number(city.transactions)}<br>
          Sessions: ${formatters.number(city.sessions)}<br>
          Conv. Rate: ${formatters.percent(city.conversionRate)}
        </div>
      `)
      
      circle.addTo(map)
      markers.push(circle)
    })
  }

  function getCityMetricValue(city) {
    switch(mapMetric.value) {
      case 'revenue': return city.revenue
      case 'transactions': return city.transactions
      case 'sessions': return city.sessions
      case 'conversionRate': return city.conversionRate
      default: return city.revenue
    }
  }

  function getMetricColor(value, maxValue) {
    const normalized = value / maxValue
    if (normalized > 0.66) return '#ef4444'
    if (normalized > 0.33) return '#f59e0b'
    return '#10b981'
  }

  function getCityColor(city) {
    const values = saCities.value.map(getCityMetricValue)
    const maxValue = Math.max(...values, 1)
    return getMetricColor(getCityMetricValue(city), maxValue)
  }

  function formatCityValue(city) {
    const value = getCityMetricValue(city)
    switch(mapMetric.value) {
      case 'revenue': return formatters.currency(value)
      case 'transactions': return formatters.number(value)
      case 'sessions': return formatters.number(value)
      case 'conversionRate': return formatters.percent(value)
      default: return formatters.currency(value)
    }
  }

  function highlightCity(city) {
    if (!map || !L) return
    
    if (highlightedMarker) {
      highlightedMarker.setStyle({ weight: 2, color: '#ffffff' })
    }
    
    const marker = markers.find(m => {
      const latLng = m.getLatLng()
      return Math.abs(latLng.lat - city.lat) < 0.01 && 
             Math.abs(latLng.lng - city.lng) < 0.01
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

  function cleanupMap() {
    if (map) {
      map.remove()
      map = null
    }
  }

  return {
    mapElement,
    mapReady,
    initMap,
    updateMapMarkers,
    highlightCity,
    resetHighlight,
    zoomToCity,
    getCityColor,
    formatCityValue,
    cleanupMap
  }
}