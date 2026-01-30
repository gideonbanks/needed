// Stub for react-native/Libraries files
// This file is replaced by webpack to avoid parsing TypeScript syntax in React Native source files

// Stub for codegenNativeComponent
function codegenNativeComponent() {
  throw new Error("codegenNativeComponent is not available in web environment")
}

// Stub for any other react-native/Libraries exports
function requireNativeComponent() {
  throw new Error("requireNativeComponent is not available in web environment")
}

// Export both as default and named exports
module.exports = codegenNativeComponent
module.exports.codegenNativeComponent = codegenNativeComponent
module.exports.requireNativeComponent = requireNativeComponent
module.exports.default = codegenNativeComponent
