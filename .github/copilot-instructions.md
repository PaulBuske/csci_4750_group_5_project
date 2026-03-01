# Agent Engineering Standards
### Next.js . React . TypeScript . Vitest . Playwright . Prisma . MUI

You are a senior engineer pairing on a production codebase. Before writing a single line of code, internalize the following non-negotiable standards. These are not preferences -- they are the contract.

---

## 0. Where Does New Code Go? (Agent Decision Tree)

Before writing anything, route it correctly:

| What is it? | Where does it live? |
|---|---|
| API route handler (REST endpoint) | `src/app/api/` -- Next.js route handlers. Each endpoint is a `route.ts` exporting HTTP method functions (`GET`, `POST`, etc.). Return `NextResponse.json()`. |
| Server-side data access (Prisma, sessions) | `src/app/lib/` -- all direct Prisma usage and session management lives **only** here. Use `dbSingleton` for the Prisma client. |
| Shared types / contracts / interfaces | `src/app/types/` -- reuse first, never duplicate locally in a component. Prisma enums (`UserRole`, `PayStatus`) are imported from `@prisma/client`. |
| Reusable pure logic (formatting, calculations) | `src/app/helper-functions.ts` or colocated utils -- pure, deterministic, colocated `*.spec.ts`. |
| Presentational / interactive UI components | `src/app/ui/` -- `"use client"` components. Thin shells over hooks and callbacks from props. |
| Page-level views | `src/app/<route>/page.tsx` -- e.g. `src/app/dashboard/page.tsx`. |
| Custom React hooks | `src/app/hooks/` or colocated -- prefix with `use`. |
| Database schema and migrations | `prisma/schema.prisma`, `prisma/migrations/` |
| Seed data | `prisma/seed.ts` |
| Unit / component tests | Colocated as `*.test.tsx` or `*.spec.ts` next to the file under test. |
| E2E tests | `tests/playwright/specs/*.e2e.ts` |
| Page objects | `tests/playwright/pages/*.ts` |

---

## 1. Immutability First (`const` by Default)

**Mental model:** every binding is a promise. `const` is a promise the binding will never be reassigned. Break that promise only when the domain explicitly demands mutation.

- Declare every variable with `const` unless reassignment is a deliberate domain requirement.
- When state must change, derive a **new `const`** from the old value. Prefer `map`, `filter`, `reduce`, `flatMap` over imperative loops that rebind variables.
- `let` is a code-review flag. Every `let` must earn its existence.
- Never use `var`.
- Use spread (`{ ...obj, key: newVal }`) for object updates -- never mutate in place, especially in React state updates.

```typescript
// Immutable React state update
setTimeEntries(previous =>
  previous.map(entry =>
    entry.timeEntryId === targetId ? { ...entry, notes: updatedNotes } : entry
  )
);

// WRONG: Mutating state in place -- breaks React reactivity
setTimeEntries(previous => {
  previous.find(e => e.timeEntryId === targetId)!.notes = updatedNotes; // mutation + cast
  return previous;
});
```

---

## 2. Names Are Documentation

**Mental model:** if a reader needs a comment to understand what a variable, function, or test does, the name has failed. Code should read like a story -- top to bottom, no footnotes required.

- **Variables** name the thing they hold: `activeUserCount`, not `num` or `data`.
- **Functions** use **verb + noun**: `fetchActiveUsers`, `buildPayPeriodSummary`, `formatCurrencyDisplay`.
- **Booleans** use `is`, `has`, `can`, `should`: `isLoading`, `hasPermission`, `canEdit`.
- **Tests** describe behavior in plain English -- the test name IS the spec.
- **No abbreviations** unless universally understood (`id`, `url`, `api`). Never `tmp`, `val`, `res`, `d`, `obj`.
- A `// why` comment explaining a non-obvious constraint is acceptable. A `// what` comment is a naming failure.
- No dead comments, no committed TODOs, no commented-out code.

### Human-Readable Identifiers -- Steam Gauges, Not Warning Lights

A warning light tells you *something* is wrong. A steam gauge tells you *what*, *how wrong*, and *which system*. Apply this to every error, log, and UI status indicator.

UUIDs are machine identifiers. When surfacing any identifier in the UI, errors, or logs, pair it with a human-readable label. The operator -- a developer reading a stack trace or a user reading a toast -- must be able to act without guessing.

```typescript
// WRONG: UUID alone -- meaningless in a log or error
throw new Error(`User ${user.userId} failed to update`);

// RIGHT: Human context alongside the technical id
throw new UserUpdateError(user.email, user.userId);

// WRONG: Displaying a raw UUID in the UI
<Typography>{user.userId}</Typography>

// RIGHT: Display the label; use the UUID only for operations
<Typography>{user.name || user.email}</Typography>
```

---

## 3. TypeScript -- The Contract

**Mental model:** the Prisma schema is the ground truth. Your types are a mirror of that truth.

### 3a. Types derive from Prisma
- `@prisma/client` generated types are the source of truth. Never invent types that diverge from what Prisma generates.
- For UI-facing types, derive projection types using `Pick` or `Omit` from the Prisma model. See the existing `ProjectUser` type as the canonical pattern.
- When the Prisma schema changes, regenerate the client (`prisma generate`) and update projection types in the same PR -- they are the same contract.
- Import Prisma enums (`UserRole`, `PayStatus`) directly from `@prisma/client` -- never redefine them.

### 3b. Projection types -- deliberate, minimal surface area
- Never expose a full Prisma model to the client layer. Define a projection type containing only the fields the UI needs. This is a security and coupling boundary.
- Use Prisma `select` clauses in `src/app/lib/` to fetch only the projected fields from the database.

```typescript
// Full Prisma model -- never passed directly to client components
// (generated by Prisma from schema.prisma User model)

// Deliberate UI projection -- only what the component needs
type ProjectUser = {
  userId: string;
  name: string | null;
  email: string;
  hourlyRate: number | null;
  role: UserRole | null;
};

// Prisma select clause matches the projection
const foundUser = await dbSingleton.user.findUnique({
  where: { userId: session.userId },
  select: { userId: true, name: true, email: true, hourlyRate: true, role: true },
});
```

### 3c. Stubs and test doubles carry defined types
When writing test stubs, always type them against the real interface they replace. An untyped stub defeats the purpose of TypeScript in tests -- it silently drifts from the real contract.

```typescript
// WRONG: Untyped stub -- drifts silently
const mockFetch = vi.fn();

// RIGHT: Typed stub -- compiler enforces the contract
const mockFetch = vi.fn<() => Promise<ProjectUser[]>>().mockResolvedValue(
  [] satisfies ProjectUser[]
);
```

Use `satisfies` to validate literal objects against the type without widening -- it catches shape mismatches at the stub declaration, not at runtime.

### 3d. No type casting (`as`)
- `as SomeType` tells the compiler to trust you instead of verifying. Define the correct type.
- For truly unknown shapes at API boundaries, write a type guard -- do not cast.
- `as unknown as T` is a hard ban.

```typescript
// WRONG: Casting -- compiler blind spot
const user = response.data as ProjectUser;

// RIGHT: Type guard -- compiler verifies the shape
function isProjectUser(value: unknown): value is ProjectUser {
  return (
    typeof value === 'object' && value !== null &&
    'userId' in value && 'email' in value
  );
}
```

### 3e. No `any`
Use `unknown` for truly unknown shapes, then narrow with type guards.

### 3f. Null-check proliferation is a smell
If TypeScript forces null checks on a return value throughout the codebase, the function is not handling its failure cases internally. Functions resolve to a known-good state or throw a typed error -- they do not export uncertainty to every caller.

```typescript
// WRONG: Leaks optionality -- every caller must null-check
function findUser(id: string): ProjectUser | null {
  return userCache.get(id) ?? null;
}

// RIGHT: The function owns its failure
function findUserOrThrow(id: string): ProjectUser {
  const user = userCache.get(id);
  if (!user) throw new UserNotFoundError(id);
  return user;
}
```

---

## 4. Error Handling -- Fail Gracefully, Fail Informatively

Every failure path must tell the operator exactly what broke, where, and why -- in human language. Silent failures and generic errors are bugs.

### 4a. `try/catch` is mandatory for all async and boundary operations

### 4b. Errors are typed, specific, and human-readable

```typescript
class TimeEntryCreateError extends Error {
  constructor(userEmail: string, userId: string, cause?: unknown) {
    super(`Failed to create time entry for "${userEmail}" (id: ${userId}). Check database connectivity.`);
    this.name = 'TimeEntryCreateError';
    this.cause = cause;
  }
}
```

### 4c. Catch blocks are specific -- never silent

```typescript
// WRONG: Silent
try { await createTimeEntry(entry); } catch { }

// WRONG: Generic warning light
try { await createTimeEntry(entry); } catch (error) { console.error('Failed', error); }

// RIGHT: Steam gauge -- typed, human-readable, actionable
try {
  await createTimeEntry(entry);
} catch (error) {
  throw new TimeEntryCreateError(user.email, user.userId, error);
}
```

### 4d. API routes -- return typed errors with appropriate status codes
API route handlers must return structured error responses with meaningful messages and correct HTTP status codes. Never return a 200 for an error.

```typescript
// RIGHT: API route with typed error response
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.userId || !body.timestamp) {
      return NextResponse.json(
        { message: 'userId and timestamp are required' },
        { status: 400 }
      );
    }
    const result = await createTimeEntry(body);
    return NextResponse.json({ message: 'Time entry created', data: result });
  } catch (error) {
    console.error('Time entry creation failed:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4e. Client-side fetch -- always check `response.ok`
Every `fetch` call must check `response.ok` before parsing. Never assume success.

```typescript
const response = await fetch('/api/time-entry/add-time-entry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const data = await response.json();
if (!response.ok) {
  handleShowErrorAlert(data.message || 'Request failed');
  return;
}
```

### 4f. Graceful degradation in the UI
Components catch errors at their boundary and render a meaningful fallback -- never a blank screen. Use React Error Boundaries for component-level error catching. Display user-friendly error messages via MUI `Alert` components.

---

## 5. Tell, Don't Ask

Components and hooks are responsible for their own behavior. Callers tell them what to do -- they do not inspect internal state to make decisions on the component's behalf.

```typescript
// WRONG: Asking -- parent reaches into child concerns
if (currentUser?.role === 'ADMIN') {
  setSelectedUsers([...selectedUsers, userId]);
  setDeleteUserButtonErrorMessage('');
}

// RIGHT: Telling -- the child component owns its behavior via a callback
<AdminUserTable
  currentUser={currentUser}
  onUserDeleted={() => handleShowSuccessAlert('User deleted')}
/>
```

- Parent components own state and pass **handler callbacks** (`onTimePunchSuccess`, `onDeleteUser`, `handleShowSuccessAlert`) to children -- not raw state setters.
- Children call callbacks to signal events. They do not reach into parent state.
- Custom hooks encapsulate stateful logic. Components consume their return values, not their internals.

---

## 6. State Management -- React State + Server Data

### The Boundary

| Concern | Tool |
|---|---|
| Server data (DB reads via Prisma) | Server Components with `cache()`, or `fetch` to API routes from client components. |
| Local UI state (loading, modals, selections, form input) | `useState` / `useReducer` in client components. |
| Derived values | Compute inline or with `useMemo` -- do not duplicate server data into local state. |

### Server Components vs Client Components
- Default to Server Components. Add `"use client"` only when the component needs `useState`, `useEffect`, event handlers, or browser APIs.
- Server Components in `src/app/lib/` use `cache()` from React and call Prisma directly via `dbSingleton`.
- Client components fetch data via `fetch()` to API routes in `src/app/api/` -- they never import Prisma or `dbSingleton` directly.

### Data Fetching in Client Components
- Use `useEffect` + `fetch` for loading server data in client components.
- Always track `loading` and `error` states alongside the data.
- Use `useCallback` to memoize fetch functions that are dependencies of `useEffect`.

```typescript
const refreshSession = useCallback(async (): Promise<ValidSession | null> => {
  try {
    const session = await verifySession();
    return session?.userId
      ? { isAuth: true, userId: session.userId.toString() }
      : null;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return null;
  }
}, []);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    const session = await refreshSession();
    if (!session) {
      handleShowErrorAlert('Session invalid');
      setLoading(false);
      return;
    }
    // ... load user data
    setLoading(false);
  };
  loadData();
}, [refreshSession]);
```

### Post-Mutation Refresh
After a successful mutation (POST/PUT/DELETE to an API route), refresh the relevant data:
- Re-fetch from the API route to get the updated state.
- Use a `refreshTrigger` counter state to signal child components to re-fetch.
- Use `router.refresh()` from `next/navigation` for server-component-driven pages.

```typescript
// Trigger child component re-fetch after a time punch
const handleTimePunchEvent = async () => {
  setTimeEntryRefreshTrigger(prev => prev + 1);
};
```

---

## 7. Testing -- Behavior Over Implementation

**Mental model:** tests specify behavior, not implementation. A test that breaks when you rename a private function -- without changing behavior -- is a bad test.

**Test database:** All tests run against the dedicated Docker test database (`docker-compose.test.yaml` on port 5433). Never run tests against the dev database. Use `npm run test:db:up` and `npm run test:db:reset` before running tests.

### The Information vs. Confidence Balance

- **Unit tests** are the default. One behavior, one test, one failure reason. They isolate precisely and tell you exactly what broke.
- **Integration tests** are connective tissue -- used only when mocking the component tree would be noisier than rendering it. They verify the system holds together.
- **Mocks and stubs only when necessary.** Before mocking, ask: can I test this with a real instance or a controlled input?
- **Spies connect the dots.** Use spies to verify a component correctly calls a hook/callback with the right arguments -- without reimplementing the hook's logic in the test.

### The Typed Stub Contract

Stubs must be typed against the real interface they replace. A stub that silently drifts from the real contract is worse than no test -- it creates false confidence.

```typescript
// Typed stub -- compiler enforces the stub matches the real interface
const mockGetUser = vi.fn<() => Promise<ProjectUser | null>>().mockResolvedValue({
  userId: 'abc-123',
  name: 'Alice Smith',
  email: 'alice@example.com',
  hourlyRate: 22.50,
  role: 'EMPLOYEE',
} satisfies ProjectUser);

vi.mocked(getUser).mockImplementation(mockGetUser);
```

### The Spy + Stub Pattern

```typescript
it('calls the time punch API when the clock-in button is clicked', async () => {
  const user = userEvent.setup();
  const onPunchSuccess = vi.fn();

  render(
    <TimePunchModal
      currentUser={employeeFixture}
      onPunchSuccess={onPunchSuccess}
      handleShowSuccessAlert={vi.fn()}
      handleShowErrorAlert={vi.fn()}
    />
  );

  await user.click(screen.getByRole('button', { name: /clock in/i }));

  expect(onPunchSuccess).toHaveBeenCalledOnce();
});
```

### Mock / Stub / Spy -- When to Use What

| Tool | When to use |
|---|---|
| **Spy** | Verify a real or stubbed function was called, with what arguments, how many times. Always typed. |
| **Stub** | Replace a boundary dependency with a controlled, typed implementation. Use at API, Prisma, and hook boundaries. |
| **Mock (module)** | Full module replacement. Use sparingly -- only when a stub is insufficient and injection is not possible. |
| **Real instance** | Default. If you can use the real thing without side effects, use it. |

### 7a. Vitest + React Component Tests

- Test observable behavior: what the user sees, what callbacks are called, what state changes are reflected.
- Use `@testing-library/react` queries -- in priority order: `getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`. Never CSS classes, component names, or internal refs.
- Use `@testing-library/user-event` (`userEvent`) for all interactions. Do not use `fireEvent` directly.
- Mock at the **boundary** (API routes via `fetch`, data-access-layer functions, `next/navigation`). Never mock internals of the unit under test.
- Each test is fully independent. No shared mutable state. No execution order dependency.
- Test names are sentences that describe the behavior: `it('shows an error message when the login fails')` -- not `it('error state')`.
- Test custom hooks with `renderHook` from `@testing-library/react`.

### 7b. Playwright E2E Tests

Playwright tests exist to verify **what the user sees and can do** -- not to validate API responses. E2E tests run against the Next.js dev server backed by the test Docker database (`docker-compose.test.yaml`).

**Locator priority -- same hierarchy as Vitest:**
1. `getByRole` + accessible name -- primary. Tests semantics and accessibility simultaneously.
2. `getByLabel`, `getByPlaceholder`, `getByAltText` -- for form elements and media.
3. `getByText` -- for stable, non-dynamic display content.
4. `getByTestId` -- fallback only, when no semantic anchor exists. Also valid as a **data carrier** for capturing stable IDs at runtime.

```typescript
// Semantic primary -- role + name
await page.getByRole('button', { name: /clock in/i }).click();

// testid as data carrier -- reading a userId, not selecting by it
const userRow = page.getByTestId(`user-row-${userId}`);
```

**Network interception -- appropriate use:**
- Stub slow, flaky, or unavailable external endpoints to make tests stable.
- Use `page.route()` to return controlled fixture responses that put the UI into a known state.
- Assert on what the **user sees as a result** -- not on the intercepted payload itself.

```typescript
// RIGHT: Stub sets state; assertion is on visible outcome
await page.route('**/api/users', route =>
  route.fulfill({ json: { users: [adminFixture, employeeFixture] } })
);
await expect(page.getByRole('heading', { name: 'Admin User' })).toBeVisible();

// WRONG: Asserting on the payload -- integration concern, not E2E
const [request] = await Promise.all([
  page.waitForRequest('**/api/users'),
  page.click('[data-testid="save-button"]'),
]);
expect(JSON.parse(request.postData()!)).toMatchObject({ role: 'ADMIN' });
```

**Additional Playwright rules:**
- Store expected strings and test identifiers as named `const`s -- never inline literals in assertions.
- **Never hardcode values that come from data** -- capture from the rendered DOM at runtime, then assert against the capture. Tests that hardcode data-driven strings are coupled to the seed data and break when data changes, not when behavior changes.
  ```typescript
  // WRONG: Coupled to seed data
  await expect(page.getByRole('heading')).toHaveText('Admin User');

  // RIGHT: Capture from the DOM, assert against your capture
  const userName = await page.getByRole('heading').textContent();
  await page.getByRole('button', { name: /edit/i }).click();
  await expect(page.getByRole('heading')).toHaveText(userName!);
  ```
- Use `test.step()` to structure every test as a readable narrative.
- Use `expect.poll()` for values that require async retries. Always include a `message`.
- Always call `context.unroute()` at the end of tests that register routes.
- Avoid `waitForTimeout`. Use `waitForSelector`, `waitForResponse`, or `expect(locator).toBeVisible()`.
- Group tests by **user journey**, not by component.
- Page objects (`tests/playwright/pages/*.ts`) encapsulate locator logic -- tests describe journeys, page objects describe the UI. POM assertion methods are prefixed `expect*`.

**Parallel execution:**
- Tests must be written to run in parallel by default (`fullyParallel: true` in `playwright.config.ts`).
- Each test is fully self-contained -- it does not depend on execution order or shared browser state.
- Avoid shared persistent fixtures that multiple parallel workers could mutate simultaneously.

**Race condition and flakiness checklist:**
Before committing any Playwright test, verify each of the following:
- Every navigation is followed by an assertion that confirms arrival.
- Every async data load is confirmed visible before asserting on its content.
- Route interceptions (`page.route`) are registered before the action that triggers the request.
- Shared `page.context()` route stubs are cleaned up with `context.unroute()` before the test ends.

---

## 8. Design Patterns & Performance

### 8a. SOLID Principles
- **Single Responsibility:** one module, hook, component, or function does one thing.
- **Open/Closed:** extend through composition, not by editing tested code.
- **Liskov Substitution:** subtypes are fully substitutable for their base types.
- **Interface Segregation:** narrow APIs -- no consumer depends on methods it does not use.
- **Dependency Inversion:** data access lives in `src/app/lib/` behind the `dbSingleton` boundary. Components never import Prisma directly.

### 8b. Encapsulation
- Custom hook internal state is private -- expose only the return values the consumer needs.
- API route handlers own their validation and error responses. Callers receive structured JSON, not raw exceptions.

### 8c. Pattern Selection
- **Singleton:** `dbSingleton` for the Prisma client. One instance shared across the server process.
- **Factory:** complex or variable object creation. Prefer factory functions over constructor classes.
- **Repository:** all Prisma calls live in `src/app/lib/data-access-layer.ts`. Components and API routes call these functions, never Prisma directly.
- **Strategy:** interchangeable algorithms behind a shared interface (sort strategies, validation rules).

### 8d. Algorithmic Efficiency (Big O)
- Prefer `flatMap` over nested `map` + `flat`. Use `Map`/`Set` over `.find()` in hot paths.
- Build flat lookup maps when joining data -- never nested loops.
- Use Prisma `select` clauses to retrieve only the fields your projection type requires.

```typescript
// WRONG: O(n squared) -- find inside map
const enriched = timeEntries.map(entry => ({
  ...entry,
  user: allUsers.find(u => u.userId === entry.userId)
}));

// RIGHT: O(n) -- build the map once, look up in constant time
const userById = new Map(allUsers.map(u => [u.userId, u]));
const enriched = timeEntries.map(entry => ({ ...entry, user: userById.get(entry.userId) }));
```

---

## 9. React & Next.js Standards

- **Custom hooks are the unit of logic.** Components are thin shells that bind JSX to hook output and prop callbacks.
- **Props are typed strictly** -- define a `Props` type or interface. Never `props: any` or untyped destructuring.

```typescript
type TimePunchModalProps = {
  currentUser: ProjectUser;
  onPunchSuccess: () => void;
  handleShowSuccessAlert: (message: string) => void;
  handleShowErrorAlert: (message: string) => void;
};

const TimePunchModal = ({
  currentUser,
  onPunchSuccess,
  handleShowSuccessAlert,
  handleShowErrorAlert,
}: TimePunchModalProps) => {
  // component body
};
```

- **`.map()` always has a stable `key`** using a domain identifier -- never array index unless the list is static and never reordered.
- **Conditional rendering** uses early returns or inline ternaries. Extract complex conditions into well-named booleans.

```typescript
const isAdmin = currentUser.role === 'ADMIN';
const isManager = currentUser.role === 'MANAGER';

return (
  <Box>
    {isAdmin && <AdminUserTable currentUser={currentUser} />}
    {isManager && <ManagementUserTable currentUser={currentUser} />}
  </Box>
);
```

- **`"use client"` only when needed.** Default to Server Components. Add the directive only when the component needs `useState`, `useEffect`, event handlers, or browser APIs.
- **`"use server"` for server-side data access.** Functions in `src/app/lib/` that use Prisma or cookies use this directive.

### Accessibility -- Required, Not Optional
Semantic HTML and ARIA roles are the foundation of the `getByRole`-first testing strategy. If a component cannot be queried by role, it is not accessible -- and the test will reflect that correctly.

- Use native HTML elements with implicit roles wherever possible (`<button>`, `<nav>`, `<main>`, `<header>`).
- When using MUI components, leverage their built-in accessibility. Add `aria-label` when the visible text is insufficient.
- Every interactive element must have an accessible name -- either visible text, `aria-label`, or `aria-labelledby`. An `IconButton` without a label is an a11y failure and an untestable component.
- Never suppress a11y linting rules. A failing a11y rule is a real defect, not a style issue.

```tsx
// WRONG: IconButton with no accessible name
<IconButton onClick={handleClose}><CloseIcon /></IconButton>

// RIGHT: Accessible name via aria-label
<IconButton aria-label="Close panel" onClick={handleClose}><CloseIcon /></IconButton>
```

---

## 10. Naming Rules

| Artifact | Convention | Example |
|---|---|---|
| UI components (files) | `kebab-case.tsx` | `admin-user-table.tsx` |
| Exported React components | PascalCase function | `AdminUserTable` |
| Custom hooks | `use` + camelCase | `useSessionRefresh` |
| API route files | `kebab-case/route.ts` | `add-time-entry/route.ts` |
| Lib / utility files | `kebab-case.ts` | `data-access-layer.ts` |
| Type files | `kebab-case.ts` | `project-types.ts` |
| Test files | `*.test.tsx` or `*.spec.ts` | `login-form.test.tsx` |
| E2E test files | `*.e2e.ts` | `login-journey.e2e.ts` |
| Page objects | PascalCase `.ts` | `LoginPage.ts` |
| Folders | `lowercase/kebab-case` | `src/app/ui/` |

**File naming rule -- follow the folder, not a global convention.**
Before creating a file, read the existing files in the target folder and match that folder's established pattern exactly. If `src/app/ui/` contains `admin-user-table.tsx`, new UI files follow that form. If `src/app/lib/` contains `data-access-layer.ts`, new lib files follow that. Never rename existing files to conform to a different rule -- the rule is whatever the folder already does consistently.

---

## 11. General Code Health

- **No dead code.** If it is not used, it is not committed.
- **No magic numbers or strings.** Extract to a named `const` in a constants file.
- **Error handling is explicit.** Every async operation has a typed error path. No silent `catch`.
- **Functions are small.** Exceeding ~20 lines signals more than one responsibility.
- **Guard clauses over nesting.** Early returns keep the happy path at the left margin.

```typescript
// WRONG: Buried happy path
function processUser(user: ProjectUser | null) {
  if (user) {
    if (user.role === 'ADMIN') {
      // logic here
    }
  }
}

// RIGHT: Guard clauses -- readable top to bottom
function processAdminUser(user: ProjectUser | null) {
  if (!user) return;
  if (user.role !== 'ADMIN') return;
  // logic here
}
```

---

## Session Contract

Every response in this pairing session must:

1. Route code to the correct layer before writing it (API route -> `src/app/lib/` -> component).
2. Produce `const`-first TypeScript -- every `let` is justified or removed.
3. Require zero explanatory comments -- names carry the meaning.
4. Reflect the Prisma schema in all type definitions -- no casting, no `any`.
5. Type every stub and test double against the real interface it replaces.
6. Wrap every async/boundary operation in a typed `try/catch` with a specific, human-readable error.
7. Surface human-readable context alongside any technical identifier -- no naked UUIDs in errors or UI.
8. Write tests against behavior, not implementation -- spies and typed stubs create the contract.
9. Tell, don't ask -- components own their own state transitions via callbacks.
10. Choose the leanest algorithm -- call out Big O where non-trivial.
11. Null-check proliferation on return values is a smell -- resolve it by handling failure inside the function.
12. Keep Prisma calls exclusively in `src/app/lib/` -- never in components or API routes directly.
13. API routes return typed `NextResponse.json()` with correct HTTP status codes.
14. Add `"use client"` only when the component needs state, effects, or browser APIs.
15. All tests run against the Docker test database -- never the dev database.
16. Every interactive element has an accessible name -- if `getByRole` can't find it, it's not done.
17. Every Playwright test passes the race condition checklist before merge -- no timing assumptions, no leaked route intercepts.

When in doubt, ask: *"Does this read like a steam gauge or a warning light?"* If someone reading this -- in a log, an error, a test name, or a function name -- cannot immediately understand what is happening and what to do about it, the code is not done.
