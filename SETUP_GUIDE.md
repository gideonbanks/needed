# Needed.co.nz — Monorepo Setup Guide

This guide walks through setting up the Turborepo monorepo structure and adapting the Next.js Enterprise Boilerplate for the Needed.co.nz project.

---

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git
- Vercel account (for deployment)
- Supabase account (for backend)
- Expo account (for mobile app)

---

## Step 1: Initialize Turborepo Monorepo

```bash
# Create the monorepo root
mkdir needed && cd needed
npm create turbo@latest

# When prompted:
# - Package manager: pnpm (recommended) or npm
# - Template: Empty
```

This creates the basic Turborepo structure. Now we'll customize it.

---

## Step 2: Project Structure

Your final structure should look like:

```
needed/
├── apps/
│   ├── web/              # Next.js App Router (from Enterprise Boilerplate)
│   └── mobile/           # Expo React Native
├── packages/
│   ├── ui/               # Tamagui shared components
│   ├── shared/           # Types, validation, constants
│   └── config/           # Shared configs (ESLint, TypeScript, etc.)
├── turbo.json
├── package.json
├── pnpm-workspace.yaml   # or package.json workspaces
└── .gitignore
```

---

## Step 3: Set Up Web App (Next.js Enterprise Boilerplate)

### 3.1 Clone/Download Enterprise Boilerplate

```bash
# Option A: Use Next.js with TypeScript and testing setup
npx create-next-app@latest apps/web --example "https://github.com/vercel/next.js/tree/canary/examples/with-typescript-eslint-jest"

# Option B: Manual setup (recommended for full control)
cd apps
npx create-next-app@latest web --typescript --app --no-src-dir
cd web
```

### 3.2 Install Enterprise Boilerplate Dependencies

```bash
cd apps/web

# Core dependencies
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zod react-hook-form @hookform/resolvers
pnpm add date-fns
pnpm add @vercel/analytics @vercel/speed-insights

# Remove Tailwind (we'll use Tamagui)
pnpm remove tailwindcss postcss autoprefixer

# Add Tamagui
pnpm add @tamagui/core @tamagui/config
pnpm add @tamagui/babel-plugin @tamagui/next-plugin
pnpm add -D @tamagui/animations-react-native @tamagui/lucide-icons
```

### 3.3 Configure Next.js for App Router + ISR

Create/update `apps/web/next.config.js`:

```javascript
const { withTamagui } = require('@tamagui/next-plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable if using Tamagui
    optimizePackageImports: ['@tamagui/core'],
  },
};

module.exports = withTamagui(nextConfig);
```

### 3.4 Set Up ISR for SEO Pages

Create `apps/web/app/[service]/[location]/page.tsx`:

```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// This will be your 50 SEO pages
const SERVICES = ['plumber', 'electrician', 'locksmith', /* ... */];
const LOCATIONS = ['auckland', 'wellington', 'christchurch', /* ... */];

export async function generateStaticParams() {
  const params = [];
  for (const service of SERVICES) {
    for (const location of LOCATIONS) {
      params.push({ service, location });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; location: string }>;
}): Promise<Metadata> {
  const { service, location } = await params;
  return {
    title: `${service} in ${location} | Needed`,
    description: `Get ${service} help in ${location}. Sent to 3 available pros.`,
  };
}

// ISR: Revalidate every 24 hours
export const revalidate = 86400;

export default async function ServiceLocationPage({
  params,
}: {
  params: Promise<{ service: string; location: string }>;
}) {
  const { service, location } = await params;
  // Validate params
  if (!SERVICES.includes(service) || !LOCATIONS.includes(location)) {
    notFound();
  }

  return (
    <div>
      {/* Your service/location page content */}
      <h1>{service} in {location}</h1>
      {/* Request form component */}
    </div>
  );
}
```

---

## Step 4: Set Up Shared Packages

### 4.1 Create Shared Types Package

```bash
mkdir -p packages/shared/src
cd packages/shared
```

Create `packages/shared/package.json`:

```json
{
  "name": "@needed/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

Create `packages/shared/src/types.ts`:

```typescript
import { z } from 'zod';

// Request types
export const ServiceSchema = z.enum([
  'plumber',
  'electrician',
  'locksmith',
  'movers',
  'carpet-cleaning',
  'rubbish-removal',
  // ... add all services
]);

export const TimeNeedSchema = z.enum(['now', 'today', 'this-week']);

export const RequestStatusSchema = z.enum([
  'draft',
  'sent',
  'contacted',
  'cancelled',
  'sorted',
  'expired',
]);

export type Service = z.infer<typeof ServiceSchema>;
export type TimeNeed = z.infer<typeof TimeNeedSchema>;
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

// Request creation
export const CreateRequestSchema = z.object({
  serviceId: ServiceSchema,
  timeNeed: TimeNeedSchema,
  suburb: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  details: z.string().min(1),
  photoUrl: z.string().url().optional(),
});

export type CreateRequest = z.infer<typeof CreateRequestSchema>;
```

Create `packages/shared/src/index.ts`:

```typescript
export * from './types';
export * from './constants';
export * from './validation';
```

### 4.2 Create UI Package (Tamagui)

```bash
cd ../../packages
mkdir -p ui/src
cd ui
```

Create `packages/ui/package.json`:

```json
{
  "name": "@needed/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@tamagui/core": "^1.144.3",
    "@tamagui/config": "^1.144.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.3"
  }
}
```

Create `packages/ui/src/tamagui.config.ts`:

```typescript
import { config } from '@tamagui/config/v3';
import { createTamagui } from '@tamagui/core';

// Your design tokens
const appConfig = createTamagui({
  ...config,
  tokens: {
    ...config.tokens,
    // Customize spacing, colors, etc.
  },
});

export default appConfig;

export type Conf = typeof appConfig;
declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
```

Create `packages/ui/src/components/Button.tsx`:

```typescript
import { Button as TamaguiButton, styled } from '@tamagui/core';

export const Button = styled(TamaguiButton, {
  // Your button styles
});
```

Create `packages/ui/src/index.ts`:

```typescript
export * from './components/Button';
export * from './components/Tile';
export * from './components/Chip';
// Export all shared components
```

### 4.3 Create Config Package

```bash
cd ../config
mkdir -p eslint-config typescript-config
```

Create `packages/config/eslint-config/package.json`:

```json
{
  "name": "@needed/eslint-config",
  "version": "0.0.0",
  "private": true,
  "main": "index.js",
  "files": ["index.js"],
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint-config-next": "^14.0.0",
    "eslint-config-prettier": "^9.1.0"
  }
}
```

Create `packages/config/eslint-config/index.js`:

```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Your shared ESLint rules
  },
};
```

---

## Step 5: Configure Turborepo

Create `turbo.json` at root:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

If you are targeting Turborepo v2+, migrate existing configs automatically:

```bash
npx @turbo/codemod migrate
```

Update root `package.json`:

```json
{
  "name": "needed",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.3.3"
  },
  "packageManager": "pnpm@8.10.0"
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## Step 6: Set Up Mobile App (Expo)

```bash
cd apps
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
```

Install Tamagui for React Native:

```bash
pnpm add @tamagui/core @tamagui/config
pnpm add @tamagui/babel-plugin @tamagui/metro-plugin
pnpm add react-native-reanimated react-native-safe-area-context
```

Update `apps/mobile/package.json` to use workspace packages:

```json
{
  "dependencies": {
    "@needed/shared": "workspace:*",
    "@needed/ui": "workspace:*"
  }
}
```

---

## Step 7: Supabase Integration

### 7.1 Install Supabase Client

In `apps/web`:

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

Create `apps/web/lib/supabase/client.ts`:


### 7.2 Generate TypeScript Types

```bash
# Install Supabase CLI
npm i supabase --save-dev

# Generate types from your Supabase schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > packages/shared/src/database.types.ts
```

---

## Step 8: Environment Variables

Create `.env.example` at root:


**⚠️ Security Best Practices:**

1. Copy `.env.example` to `.env.local` for local development:
   ```bash
   cp .env.example .env.local
   ```
2. Never commit `.env.local` to git. Ensure `.gitignore` includes:
   ```
   .env*.local
   .env
   ```
3. Only `NEXT_PUBLIC_*` variables are exposed to the browser. Keep sensitive keys (like `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) without this prefix.
4. Use the Vercel environment variables dashboard for production secrets.

---

## Step 9: Sitemap Generation

Create `apps/web/app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next';

const SERVICES = ['plumber', 'electrician', /* ... */];
const LOCATIONS = ['auckland', 'wellington', /* ... */];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://needed.co.nz';
  
  const serviceLocationPages = SERVICES.flatMap((service) =>
    LOCATIONS.map((location) => ({
      url: `${baseUrl}/${service}/${location}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...serviceLocationPages,
  ];
}
```

---

## Step 10: Development Workflow

### Start Development

```bash
# From root
pnpm install
pnpm dev

# This runs:
# - apps/web (Next.js on :3000)
# - apps/mobile (Expo on :8081)
```

### Build for Production

```bash
pnpm build
```

### Type Check

```bash
pnpm type-check
```

---

## Step 11: Vercel Deployment

1. Connect your repo to Vercel
2. Set root directory to `apps/web`
3. Configure environment variables
4. Enable ISR (automatic with Next.js App Router)

For the mobile app, use EAS Build (Expo's build service).

---

## Next Steps

1. Set up Supabase database schema (see NEEDED.md section 12)
2. Implement the 3-screen request flow
3. Set up provider matching algorithm
4. Configure Twilio for phone verification
5. Set up Stripe for payments
6. Implement the 10-minute timer logic

---

## Troubleshooting

### Workspace dependencies not resolving

```bash
# Clear pnpm cache
pnpm store prune
pnpm install
```

### TypeScript errors in shared packages

Ensure `tsconfig.json` in each package extends the root config and includes proper paths.

### Tamagui not working in Next.js

Check that you've configured the Tamagui plugin in `next.config.js` and imported the config in your app.

---

## Resources

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Tamagui Docs](https://tamagui.dev/docs/core/configuration)
- [Supabase Docs](https://supabase.com/docs)
