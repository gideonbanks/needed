// Polyfill for react-native exports that react-native-web doesn't provide
// This is used when react-native-svg or other packages try to import from react-native

// Re-export everything from react-native-web first
const rnWeb = require('react-native-web')

// Then add missing exports
const processColor = (color) => {
  if (color === undefined || color === null) {
    return color
  }
  
  // If it's already a number (Android format), return it
  if (typeof color === 'number') {
    return color
  }
  
  // If it's a string, try to parse it as a hex color
  if (typeof color === 'string') {
    // Remove # if present
    const hex = color.replace('#', '')

    // Expand shorthand hex (3 or 4 digits) to full length
    let expandedHex = hex
    if (hex.length === 3) {
      expandedHex =
        hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    } else if (hex.length === 4) {
      expandedHex =
        hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    }
    
    // Parse hex to number (ARGB format for React Native)
    if (expandedHex.length === 6) {
      // RGB -> ARGB (add FF for full opacity)
      return parseInt(`FF${expandedHex}`, 16)
    } else if (expandedHex.length === 8) {
      // CSS uses RGBA, convert to ARGB for React Native
      const rgba = expandedHex
      const argb = rgba.slice(6, 8) + rgba.slice(0, 6) // Move AA to front
      return parseInt(argb, 16)
    }
  }
  
  // Return 0 (transparent) as fallback
  return 0
}

// Export everything from react-native-web plus our additions
// Use Object.assign to merge all exports
module.exports = Object.assign({}, rnWeb, {
  processColor,
})
