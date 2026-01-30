#!/bin/bash

# Needed.co.nz Monorepo Bootstrap Script
# This script sets up the initial monorepo structure

set -e

echo "🚀 Bootstrapping Needed.co.nz monorepo..."

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Current: $(node -v)"
  exit 1
fi

# Initialize Turborepo
echo "📦 Initializing Turborepo..."
npx create-turbo@latest . --package-manager pnpm --no-install

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p apps/web apps/mobile
mkdir -p packages/ui/src/components
mkdir -p packages/shared/src
mkdir -p packages/config/eslint-config packages/config/typescript-config

# Create workspace file
echo "⚙️  Setting up workspace..."
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Initialize web app
echo "🌐 Setting up Next.js web app..."
cd apps/web
npx create-next-app@latest . --typescript --app --no-tailwind --no-src-dir --import-alias "@/*" --skip-install
cd ../..

# Initialize mobile app
echo "📱 Setting up Expo mobile app..."
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript --skip-install
cd ../..

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

echo "✅ Bootstrap complete!"
echo ""
echo "Next steps:"
echo "1. Review SETUP_GUIDE.md for detailed configuration"
echo "2. Set up environment variables (.env files)"
echo "3. Configure Supabase and generate types"
echo "4. Set up Tamagui in packages/ui"
echo "5. Run 'pnpm dev' to start development"
