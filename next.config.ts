import withBundleAnalyzer from "@next/bundle-analyzer"
import { type NextConfig } from "next"
import type { RuleSetRule } from "webpack"
import path from "path"

import { env } from "./env.mjs"

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Next 16 enables Turbopack by default. We use a custom webpack config, so we
  // explicitly define Turbopack config (even if empty) to avoid build-time errors.
  turbopack: {},
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    optimizePackageImports: ["@tamagui/core", "@tamagui/config"],
  },
  // Transpile packages that use React Native or have TypeScript syntax
  // This tells Next.js to bundle and transform these packages (using SWC)
  // instead of treating them as pre-compiled external dependencies
  transpilePackages: [
    "tamagui",
    "@tamagui/core",
    "@tamagui/config",
    "@tamagui/animations-react-native",
    "@tamagui/react-native-svg",
    "react-native-svg",
  ],
  webpack: (config, { isServer, webpack, dev }) => {
    // Note: Webpack may show warnings about serializing large strings in cache.
    // This is a harmless performance warning that occurs with large source maps or generated code.
    // It doesn't affect functionality - webpack will still cache correctly.

    // CRITICAL: Apply aliases BEFORE any other processing to prevent SWC from parsing react-native
    // This must happen for both server and client
    config.resolve.alias = {
      ...config.resolve.alias,
      // Use polyfill that re-exports react-native-web and adds missing exports
      "react-native$": path.resolve(__dirname, "lib/webpack/react-native-polyfill.js"),
      // For react-native-svg, use the Tamagui version which handles web properly
      "react-native-svg": "@tamagui/react-native-svg",
      // Prevent any imports of react-native/Libraries files - catch ALL Libraries imports
      "react-native/Libraries": path.resolve(__dirname, "lib/webpack/react-native-stub.js"),
    }
    
    // Apply plugins to both server and client
    config.plugins = [
      // Replace ALL react-native/Libraries imports with stub
      new webpack.NormalModuleReplacementPlugin(
        /^react-native\/Libraries\//,
        path.resolve(__dirname, "lib/webpack/react-native-stub.js")
      ),
      ...(config.plugins || []),
    ]

    // Avoid filesystem cache writes in dev (can fail on some filesystems).
    if (dev) {
      config.cache = { type: "memory" }
    }
    
    if (!isServer) {

      // Completely ignore react-native source files that cause parsing errors
      config.plugins = [
        ...(config.plugins || []),
        // Ignore ALL react-native Libraries files
        new webpack.IgnorePlugin({
          resourceRegExp: /react-native\/Libraries\/.*/,
        }),
        // Ignore react-native entirely when imported from node_modules
        new webpack.IgnorePlugin({
          checkResource(resource: string, context: string) {
            // Ignore if trying to import react-native from within react-native itself
            if (/node_modules[/\\]react-native/.test(context) && resource.includes("react-native")) {
              return true
            }
            return false
          },
        }),
      ]

      // Note: react-native fallback is set above to use polyfill

      // Ignore problematic react-native files that Next.js tries to parse
      // These files contain TypeScript syntax that webpack can't handle
      const rules = config.module?.rules || []
      config.module = {
        ...config.module,
        rules: rules.map((rule: RuleSetRule | "...") => {
          if (rule && typeof rule === "object" && rule.test) {
            // Check if this rule processes JS/TS files
            const testRegex = rule.test instanceof RegExp ? rule.test : null
            const matchesJsTs = testRegex
              ? testRegex.test(".ts") ||
                testRegex.test(".tsx") ||
                testRegex.test(".js") ||
                testRegex.test(".jsx")
              : false
            if (matchesJsTs) {
              return {
                ...rule,
                exclude: [
                  ...(Array.isArray(rule.exclude) ? rule.exclude : rule.exclude ? [rule.exclude] : []),
                  /node_modules\/react-native\/Libraries\/.*/,
                  /node_modules\/react-native\/.*\.js$/,
                ],
              }
            }
          }
          return rule
        }),
      }
    }

    // Exclude react-native from server-side bundle
    if (isServer) {
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push("react-native")
      } else if (typeof config.externals === "function") {
        const originalExternals = config.externals
        config.externals = (
          params: { context: string; request: string; contextInfo: unknown; getResolve: unknown },
          callback: (err: Error | null, result?: string) => void
        ) => {
          const { context, request, contextInfo, getResolve } = params
          if (request === "react-native" || request?.startsWith("react-native/")) {
            return callback(null, "commonjs " + request)
          }
          originalExternals({ context, request, contextInfo, getResolve }, callback)
        }
      } else if (config.externals && typeof config.externals === "object") {
        config.externals = {
          ...(config.externals as Record<string, unknown>),
          "react-native": "commonjs react-native",
        }
      }
    }

    return config
  },
  rewrites: async () => [
    { source: "/healthz", destination: "/api/health" },
    { source: "/api/healthz", destination: "/api/health" },
    { source: "/health", destination: "/api/health" },
    { source: "/ping", destination: "/api/health" },
  ],
}

export default env.ANALYZE ? withBundleAnalyzer({ enabled: env.ANALYZE })(config) : config
