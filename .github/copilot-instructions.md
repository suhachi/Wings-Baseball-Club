# Wings Baseball Club PWA - Copilot Instructions

## 1. Project Overview & Architecture
- **Type**: Progressive Web App (PWA) for baseball club management.
- **Stack**: React 18, TypeScript, Vite, Tailwind CSS v4, Firebase (Auth, Firestore, Storage).
- **State Management**: React Context API (`AuthContext`, `DataContext`, `ClubContext`).
- **Routing**: **Custom State-Based Routing**. This project does NOT use `react-router-dom`.
  - Navigation is handled by `currentPage` state in `src/app/App.tsx`.
  - Use `handlePageChange` prop or callback to navigate between pages.
  - Exception: `/install` path is handled via `window.location.pathname`.

## 2. Key Directories & File Structure
- `src/app/`: Main application logic.
  - `components/ui/`: Reusable UI components (shadcn/ui).
  - `contexts/`: Global state providers.
  - `pages/`: Full page components (e.g., `HomePage`, `SchedulePage`).
- `src/lib/firebase/`: Firebase service wrappers. **Always use these services** instead of direct Firebase SDK calls.
  - `auth.service.ts`, `firestore.service.ts`, `storage.service.ts`.
- `src/styles/`: Global styles and Tailwind configuration.
- `firestore.rules`: Security rules defining the data model and access control.

## 3. Coding Conventions & Patterns

### Imports
- Use the `@` alias for `src` directory imports.
  - Example: `import { Button } from '@/app/components/ui/button';`

### Styling
- **Tailwind CSS v4**: Use utility classes for styling.
- **shadcn/ui**: Prefer using existing components in `src/app/components/ui` over building from scratch.
- **Responsive Design**: Mobile-first approach is critical as this is a PWA.

### Data Access & Firebase
- **Context Hooks**: Access global data via `useAuth()`, `useData()`, and `useClub()`.
- **Service Layer**: Put Firestore logic in `src/lib/firebase/firestore.service.ts`.
- **Security Rules**: Be aware of `firestore.rules`.
  - Data is scoped by `clubs/{clubId}`.
  - Write operations often require `isActiveMember` or `isAdminLike` status.
  - `user.role` determines permissions (ADMIN, PRESIDENT, DIRECTOR, TREASURER, MEMBER).

### Component Structure
- **Page Components**: Should handle layout and pass data to child components.
- **Functional Components**: Use `React.FC` or standard function declarations with typed props.

## 4. Critical Workflows
- **Development**: `npm run dev`
- **Type Check**: `npm run type-check` (Run this to catch TypeScript errors).
- **Build**: `npm run build`

## 5. Common Pitfalls to Avoid
- **Routing**: Do not try to use `useNavigate` or `Link` from `react-router-dom`. Use the state-based navigation pattern found in `App.tsx`.
- **Direct Firestore Calls**: Avoid calling `getDoc`, `addDoc` directly in components. Create/use a method in `firestore.service.ts`.
- **Role Checks**: Always verify user roles using the helper functions or properties from `useAuth()`/`useData()` before enabling administrative features.
