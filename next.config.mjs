/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['framer-motion'],
  webpack: (config, { isServer }) => {
    // Ignore pg-native warnings (it's optional and not needed)
    config.resolve.alias = {
      ...config.resolve.alias,
      'pg-native': false,
      'pg-cloudflare': false,
    }

    // Ignore cloudflare-specific modules and optional pg dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'cloudflare:sockets': false,
    }

    // Externalize pg modules for server-side only
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'pg-native': 'commonjs pg-native',
        'pg-cloudflare': 'commonjs pg-cloudflare',
      })
    }

    // Ignore specific module warnings
    config.ignoreWarnings = [
      { module: /node_modules\/pg-cloudflare/ },
      { module: /node_modules\/pg-native/ },
    ]

    return config
  },
}

export default nextConfig
