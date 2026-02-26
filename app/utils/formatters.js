export const formatters = {
  currency: (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0 
    }).format(value)
  },
  
  number: (value) => {
    return new Intl.NumberFormat('en-US').format(value)
  },
  
  percent: (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'percent', 
      minimumFractionDigits: 1 
    }).format(value / 100)
  },
  
  truncate: (str, maxLength) => {
    if (!str) return str
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
  }
}