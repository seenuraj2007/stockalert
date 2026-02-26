# AGENTS.md - StockAlert Development Guide

This file provides guidelines for AI agents working on the StockAlert codebase.

## Overview

StockAlert is a Next.js 16 inventory management system with TypeScript, PostgreSQL/Prisma, and React 19. Built for Indian SMBs with WhatsApp alerts, Tally integration, and GST invoicing.

---

## Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production (includes prisma generate + db push)
npm run start        # Start production server
```

### Testing
```bash
npm test             # Run tests in watch mode
npm run test:run     # Run tests once (CI mode)
npm run test:coverage # Run tests with coverage report

# Run a single test file
npm test -- src/lib/utils.test.ts

# Run tests matching a pattern
npm test -- --grep "validates email"
```

### Linting & Type Checking
```bash
npm run lint         # Run ESLint
```

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes
│   └── (routes )/   # Page routes
├── components/       # React components
│   └── ui/          # Reusable UI components (Radix/Tailwind)
├── hooks/           # Custom React hooks
├── lib/             # Utilities, helpers, Prisma client
└── types/           # TypeScript type definitions
```

---

## Code Style Guidelines

### TypeScript

- **Strict Mode**: Enabled in `tsconfig.json`. Do not disable strict checks.
- **Type Usage**: Always define interfaces/types for data structures. Avoid `any`.
- **Strict Typing Example**:
  ```typescript
  // Good
  interface Product {
    id: string
    name: string
    quantity: number
    price: number
  }

  // Avoid
  const product: any = ...
  ```
- **Null Handling**: Use optional chaining (`?.`) and nullish coalescing (`??`)
- **Import Path Alias**: Use `@/` for imports from `src/` (e.g., `@/components/...`)

### React Components

- **Functional Components**: Use only functional components with hooks
- **Component Pattern**:
  ```typescript
  interface ComponentNameProps {
    required: string
    optional?: number
  }

  export function ComponentName({ required, optional = 0 }: ComponentNameProps) {
    return <div>{required}</div>
  }
  ```
- **File Naming**: PascalCase for components (`SidebarMenu.tsx`), camelCase for utilities (`utils.ts`)
- **Client Components**: Add `'use client'` directive only when using hooks or browser APIs

### Imports

- **Order** (follow ESLint/Next.js conventions):
  1. React/Next imports
  2. External libraries
  3. Internal imports (`@/...`)
  4. Relative imports (`../`, `./`)
- **No `.js` extensions**: Use extensions only when necessary

### Formatting

- **Tailwind CSS**: Use Tailwind utility classes for all styling
- **Tailwind Merge**: Use `clsx` and `tailwind-merge` for conditional classes:
  ```typescript
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  function cn(...inputs: (string | undefined)[]) {
    return twMerge(clsx(inputs))
  }
  ```
- **No inline styles**: Avoid `style={{}}` props; use Tailwind classes

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `SidebarMenu.tsx` |
| Functions | camelCase | `formatCurrency()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Interfaces | PascalCase | `ProductProps` |
| Files | kebab-case | `utils.ts` |
| Directories | kebab-case | `src/lib/` |

### Error Handling

- **API Routes**: Use try-catch with proper error responses:
  ```typescript
  try {
    const result = await dbOperation()
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Operation failed:', error)
    return NextResponse.json(
      { error: 'User-friendly error message' },
      { status: 500 }
    )
  }
  ```
- **Zod Validation**: Use Zod for input validation in API routes
- **Error Boundaries**: Use the existing `ErrorBoundary` component for React error handling

### Database (Prisma)

- **Schema**: Edit `prisma/schema.prisma` for database changes
- **Migrations**: Always create migrations for schema changes:
  ```bash
  npx prisma migrate dev --name migration_name
  ```
- **Client**: Import Prisma client from `@/lib/db` (singleton pattern)
- **Queries**: Use Prisma's type-safe queries; avoid raw SQL unless necessary

---

## ESLint Configuration

The project uses ESLint with Next.js core-web-vitals config. Key rules:

- `@typescript-eslint/no-explicit-any`: Off (allowed)
- `@typescript-eslint/no-unused-vars`: Warning
- `react-hooks/exhaustive-deps`: Warning
- `react/no-unescaped-entities`: Off

Run `npm run lint` before committing.

---

## Testing Guidelines

- **Framework**: Vitest with React Testing Library
- **Test Files**: `*.test.ts` or `*.test.tsx` in same directory as source
- **Test Setup**: `src/lib/test-setup.ts` configures jsdom environment
- **Running Single Tests**:
  ```bash
  npm test -- src/lib/utils.test.ts
  npm test -- --run src/app/api/auth/__tests__/auth.test.ts
  ```
- **Watch Mode**: `npm test` runs in watch mode for development

---

## State Management

- **Server State**: Use React Server Components and Server Actions
- **Client State**: Use React hooks (`useState`, `useReducer`)
- **Subscriptions**: Use `useSubscriptionLimits` hook for plan limits

---

## Security

- **Environment Variables**: Never commit secrets; use `.env.local`
- **API Keys**: Store in environment, access via `process.env`
- **Auth**: JWT-based authentication with httpOnly cookies
- **Input Validation**: Always validate user input with Zod

---

## Additional Tools

- **React Doctor**: Run after making React changes:
  ```bash
  npx -y react-doctor@latest . --verbose --diff
  ```
- **Database Seeding**: `npx prisma db seed` (if configured)
- **OpenAPI Docs**: `npm run openapi` generates OpenAPI spec

---

## Common Issues

- **Build failures**: Run `npx prisma generate` before building
- **Type errors**: Ensure `@types/*` packages are installed
- **Test failures**: Check `vitest.config.ts` for test environment setup
