# Agentic guidelines

## Core Principles

**Read first, code second.** Always understand the existing file structure, patterns, and conventions before implementing changes. Find 2-3 similar components/features to identify established patterns.

**Plan before executing.** For non-trivial tasks:
1. Outline a brief conceptual checklist (3-7 bullets)
2. Identify architectural implications and trade-offs
3. When multiple viable approaches exist, ask the user
4. Implement step-by-step, validating as you go

**Maintain consistency.** Use existing libraries, utilities, and patterns. Avoid introducing new dependencies without clear justification.

**No comments by default.** Write self-explanatory code with clear naming and structure. Only add comments for complex algorithms or non-obvious business logic that cannot be made clearer through code alone.

---

## Technical Standards

### TypeScript & Code Quality
- **Strict TypeScript**: Target ES2024, strict mode enabled. Avoid `any` - use explicit types
- **Module system**: Use `"module": "nodenext"` and `"moduleResolution": "nodenext"`
- **Path aliases**: Use `@/` for imports (defined in tsconfig paths)
- **Server-only code**: Add `import "server-only"` to lib files with sensitive logic (env, auth, DB queries)
- **Type safety**: Explicitly type all function parameters and return values
- **Validation**: Use Zod schemas to validate all client data (API requests, form inputs, external data)
- **Composition over inheritance**: Favor interfaces and dependency injection for testability

### Style & Formatting
- **Prettier config**: 120 char line width, 2 spaces, no semicolons, double quotes, trailing commas
- **Import order**: Handled by `prettier-plugin-organize-imports` (auto-sorts imports)
- **Naming conventions**:
  - PascalCase: Components, types, interfaces
  - camelCase: Functions, variables, file names (except components)
  - UPPER_SNAKE_CASE: Constants and enums
- **HTML escaping**: Always escape special characters (including `'` as `&apos;` and `"` as `&quot;`)
- **Comments**: Avoid comments—code should be self-explanatory through clear naming and structure. Only add comments in exceptional circumstances where complex logic or non-obvious reasoning cannot be understood otherwise

### React & Next.js Patterns

#### Server vs Client Components
- **Default to server components** for data fetching and static content
- **Use `"use client"` only when needed**:
  - State management (`useState`, `useReducer`)
  - Browser APIs (`window`, `localStorage`)
  - Event handlers (`onClick`, `onChange`)
  - React hooks (`useEffect`, `useContext`, `useRouter` from next/navigation)
  - Third-party libraries requiring browser context

#### Component Structure
```typescript
// Server Component (default)
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export default async function ServerComponent() {
  const session = await auth()
  const data = await prisma.model.findMany()
  return <div>{/* render */}</div>
}

// Client Component (when needed)
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function ClientComponent() {
  const [state, setState] = useState(false)
  return <Button onClick={() => setState(!state)}>{/* render */}</Button>
}
```

#### Data Fetching
- Fetch in server components or server actions
- Use `auth()` for session data in server components
- Use `useSession()` from `next-auth/react` in client components
- Filter sensitive data before passing to client

### UI & Design System

#### shadcn/ui + Radix UI
- **All UI components** use shadcn/ui from `@/components/ui/*`
- **Available components**: button, card, dialog, dropdown-menu, form, input, label, select, separator, tabs, toast, tooltip, alert, badge, checkbox, sheet, skeleton, switch, textarea, alert-dialog, navigation-menu, pagination, progress, accordion, avatar, collapsible, sidebar, sonner
- **Styling**: Tailwind CSS with CSS variables for theming
- **Icons**: Use `lucide-react` for all icons

#### Tailwind Patterns
- Use utility classes, avoid custom CSS unless necessary
- Use `cn()` helper from `@/lib/utils` to merge class names
- Theme colors via CSS variables (defined in `app/globals.css`)
- Responsive: mobile-first approach

### API Design

#### Route Structure
```typescript
// app/api/resource/route.ts
import { auth } from "@/auth"
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validation schema
const requestSchema = z.object({
  field: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // 2. Parse & validate
    const body = await request.json()
    const validated = requestSchema.parse(body)

    // 3. Business logic
    const result = await prisma.model.create({
      data: validated,
    })

    // 4. Return response
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    // Use standard error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

#### Authentication Patterns
- Use `requireAuth()` for protected routes
- Use `requireAdmin()` for admin-only routes
- Use `createAuthHandler()` wrapper for consistent auth handling
- Use `getOptionalAuth()` for routes where auth is optional

#### Error Handling
- Import from `@/lib/error-handling` for consistent error responses
- Use `createErrorResponse()` utility for API errors
- Always handle Zod validation errors explicitly
- Log errors but don't expose internals to clients

#### Rate Limiting
- Import rate limit configs from `@/lib/rate-limiting`
- Use predefined limits: `RATE_LIMITS.CHAT_FREE`, `RATE_LIMITS.REVIEWS`, etc.
- Check rate limits before expensive operations
- Return 429 with reset time when exceeded

### Database (Prisma)

#### Database Environments

- **Development**: `biocontext_dev` - Use `npx prisma migrate dev`
- **Staging**: `biocontext_staging` - Use `npx prisma migrate deploy`
- **Production**: `biocontext-ai-prod` - Use `npx prisma migrate deploy`

##### Workflow

1. **Local development**: Make schema changes, run `npx prisma migrate dev --create-only --name description`
2. **Deploy to staging**: Push code, ask the user to run `npx prisma migrate deploy` with staging DATABASE_URL
3. **Deploy to production**: After staging verification, ask the user to run `npx prisma migrate deploy` with production DATABASE_URL

#### Example

```bash
# Always create migrations with --create-only
npx prisma migrate dev --create-only --name descriptive_migration_name

# Never run these without user approval:
# npx prisma migrate dev (applies migration)
# npx prisma migrate reset (destructive)
```

##### Important
- AWLAYS use `--create-only`
- NEVER use `migrate dev` on staging or production
- ALWAYS use `migrate deploy` for staging and production
- Shadow database is only used in development

#### Schema Patterns
- All models have `id`, `createdAt`, `updatedAt`
- Use `@relation` for foreign keys with `onDelete` cascade where appropriate
- Enums for fixed sets of values (`UserRole`, `UserStatus`)
- Use `@unique` for unique constraints, `@@index` for performance

#### Query Patterns
```typescript
import { prisma } from "@/lib/prisma"

// Select only needed fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true, email: true },
})

// Include relations
const post = await prisma.blogPost.findMany({
  include: { author: true },
})

// Transactions for multiple operations
await prisma.$transaction([
  prisma.model1.create({ data: {} }),
  prisma.model2.update({ where: {}, data: {} }),
])
```

### Environment Variables
- **Validation**: All env vars validated via `@/lib/env.ts` using Zod
- **Type-safe access**: Import `env` from `@/lib/env`
- **Required vars**:
  - `NEXT_PUBLIC_BASE_URL`: Public URL
  - `DATABASE_URL`: Postgres connection
  - `AUTH_SECRET`: Auth.js secret (32+ chars)
  - `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`: OAuth
  - `AUTH_LINKEDIN_ID`, `AUTH_LINKEDIN_SECRET`: OAuth
  - `GITHUB_TOKEN`: API access
  - `GEMINI_API_KEY`: AI features
  - `CRON_SECRET`: Cron job auth
- **Never hardcode secrets** in code or commit to git

### Security Headers
- CSP configured in `next.config.ts`
- Security headers: X-Frame-Options, X-Content-Type-Options, HSTS, etc.
- Content sanitization using `isomorphic-dompurify` and `sanitize-html`
- Rate limiting on public endpoints

---

## Development Workflow

### Environment Setup
```bash
nvm use  # Always run before any commands
```

### Code Quality
```bash
# Lint (runs Prettier + ESLint)
npm run lint

# Pre-commit hooks automatically run:
# - Prettier (formatting)
# - ESLint (linting)
# via Husky + lint-staged
```

### Testing

#### Playwright E2E Tests
```bash
npm run build:test    # Build with test env
npm run start:test    # Start test server
npm test              # Run tests
npm run test:ui       # Interactive mode
npm run test:debug    # Debug mode
```

#### Test Patterns
- Tests in `tests/*.spec.ts`
- Test both authenticated and unauthenticated flows
- Use `test.describe()` to group related tests
- Use `test.skip()` to skip tests conditionally
- Never disable tests—fix or update them
- Add tests for new features before considering them complete

### Database Migrations
```bash
# Check migration status
npx prisma migrate status

# Create new migration (don't apply)
npx prisma migrate dev --create-only --name descriptive_name

# Open Prisma Studio
npx prisma studio
```

### Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
```

---

## Architecture Guidelines

### Next.js App Router
- **File-based routing**: `app/` directory
- **Route groups**: Use `(group)` for organization without affecting URL
- **API routes**: `app/api/*/route.ts` with named exports (GET, POST, etc.)
- **Middleware**: Auth middleware in `middleware.ts`
- **Metadata**: Export `metadata` and `viewport` from page components

### State Management
- **Server state**: React Server Components (default)
- **Client state**: `useState` for local, Zustand for global (see `stores/chat.ts`)
- **URL state**: `useSearchParams` and `useRouter` from `next/navigation`
- **Form state**: `react-hook-form` with `@hookform/resolvers` and Zod

### AI & Chat
- **Vercel AI SDK**: For streaming chat responses
- **MCP (Model Context Protocol)**: Integration for biomedical context
- **Providers**: Anthropic, Google (Gemini), OpenAI via `@ai-sdk/*`

### MDX & Documentation
- **MDX support**: `@next/mdx` with remark/rehype plugins
- **Plugins in use**:
  - `remark-gfm`: GitHub Flavored Markdown
  - `remark-math`, `rehype-katex`: Math rendering
  - `remark-breaks`: Line breaks
  - `rehype-sanitize`: XSS prevention
  - `rehype-github-alerts`: Alert blocks
  - `remark-supersub`: Superscript/subscript

### Performance & Security
- **Bundle optimization**: Dynamic imports for heavy components
- **Image optimization**: Next.js Image component with configured domains
- **Content Security Policy**: Strict CSP in production
- **Sanitization**: All user content sanitized before render
- **Rate limiting**: On public APIs and resource-intensive operations

---

## Common Patterns

### Conditional Rendering
```typescript
// Use explicit boolean coercion
{isLoading && <Spinner />}
{items.length > 0 && <List items={items} />}
{error ? <Error /> : <Content />}
```

### Error Boundaries
```typescript
// Use try-catch in server components
try {
  const data = await fetchData()
} catch (error) {
  return <ErrorDisplay message="Failed to load" />
}
```

### Loading States
```typescript
// Use Suspense with fallback
<Suspense fallback={<Skeleton />}>
  <AsyncComponent />
</Suspense>
```

### Toasts & Notifications
```typescript
import { toast } from "sonner"

toast.success("Operation successful")
toast.error("Operation failed")
```

---

## Key Reminders

- **Understand before implementing**: Read 2-3 similar files first
- **Follow established patterns**: Consistency over novelty
- **Type everything explicitly**: Leverage TypeScript fully
- **Server by default**: Only use client components when necessary
- **Use the design system**: Don't create custom components unnecessarily
- **Handle errors gracefully**: Use standard error handling patterns
- **Test thoroughly**: E2E tests for features, quality over speed
- **Secure by default**: Validate input, sanitize output, rate limit
- **Ask when uncertain**: Especially for architectural decisions
- **Run `nvm use` first**: Before any terminal commands