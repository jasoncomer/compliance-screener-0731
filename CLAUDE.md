# CLAUDE.md - Blockscout App Guide

## Application Summary
Blockscout App is a comprehensive blockchain monitoring and compliance platform built with modern web technologies.

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit (@reduxjs/toolkit)
- **Styling**: Tailwind CSS with Shadcn UI components
- **Icons**: Lucide React
- **Routing**: React Router
- **UI Framework**: Radix UI primitives
- **Testing**: Vitest

### Core Features
- **Compliance Screener**: Monitors blockchain addresses and transactions
- **Block Explorer**: Views for transactions, addresses, and blocks
- **Risk Scoring**: Analytics for entity risk assessment
- **Flow Trace**: Visualization of transaction flows
- **Case Management**: For tracking investigations
- **Admin Dashboard**: User and system management

### Application Architecture
- Protected routes requiring authentication
- Theme support (light/dark mode)
- Modular views organized by feature
- Context providers for app state
- Redux slices for centralized state management

## Project Structure

```
src/
├── api/              # API client functions and endpoints
│   ├── blockchain/   # Blockchain-specific API calls
│   ├── auth.ts       # Authentication endpoints
│   ├── compliance.ts # Compliance-related endpoints
│   └── ...
├── components/       # Reusable React components
│   ├── ui/          # Shadcn UI components (Button, Input, Modal, etc.)
│   ├── common/      # Shared components
│   ├── explorer/    # Block explorer components
│   └── workspace/   # Workspace-specific components
├── views/           # Page-level components
│   ├── Compliance/  # Compliance screener views
│   ├── blockexplorer/ # Block explorer views
│   ├── Settings/    # Settings pages
│   └── ...
├── store/           # Redux store
│   ├── slices/      # Redux slices
│   ├── store.ts     # Store configuration
│   └── hooks.ts     # Typed Redux hooks
├── hooks/           # Custom React hooks
├── context/         # React context providers
├── lib/            # Utility functions and helpers
├── config/         # Configuration files
├── utils/          # General utilities
├── styles/         # Global styles
└── typings/        # TypeScript type definitions
```

## Backend API
The backend API is maintained in a **separate repository** and should NOT be included as a git submodule. API integration is handled through the `src/api/` directory using API client functions.

## Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run preview` - Preview production build locally

### Building
- `npm run build` - Build for production (runs TypeScript check first, copies redirects)

### Testing
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI

### Linting
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Run ESLint and automatically fix issues

## Git Submodules Policy
- **NEVER** add the `api` directory as a git submodule
- The API code is managed in a separate repository
- Do not run `git submodule add` commands for the api directory
- If you need to reference the API, use the API client functions in `src/api/` or API documentation

## Code Style Guidelines

### TypeScript
- Strict mode enabled with `noUnusedLocals` and `noUnusedParameters` checks
- Always define explicit types for function parameters and return values
- Use interfaces for object shapes, types for unions/intersections
- Avoid `any` - prefer `unknown` if type is truly unknown

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Functions/variables**: camelCase (e.g., `getUserData`)
- **Types/Interfaces**: PascalCase (e.g., `interface UserData {}`)
- **Files**:
  - Components: PascalCase (e.g., `Button.tsx`)
  - Utilities: camelCase (e.g., `formatDate.ts`)
  - Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)

### Imports Organization
```typescript
// 1. External libraries
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal modules
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';

// 3. Relative imports
import { formatAddress } from './utils';

// 4. Types
import type { User } from '@/typings/user';
```

### Components
- Use functional components with React hooks
- Prefer named exports over default exports
- Keep components focused and single-responsibility
- Extract complex logic into custom hooks

### State Management
- Use Redux Toolkit for global state
- Organize state into feature-based slices in `src/store/slices/`
- Use typed hooks from `src/store/hooks.ts` (`useAppDispatch`, `useAppSelector`)
- For local state, use `useState` or `useReducer`

### Error Handling
- Use try/catch for async operations
- Proper error propagation to user-facing components
- Log errors appropriately for debugging
- Show user-friendly error messages

### File Structure
- Keep related components and utilities in feature directories
- Colocate tests with the code they test
- Use barrel exports (`index.ts`) sparingly, only for public APIs

## Component Preferences

### Avoid Ant Design Components
- **DO NOT** use Ant Design components (`antd`) in new code
- Migrate away from Ant Design when modifying existing components
- This applies to all components: `Button`, `Input`, `Modal`, `Table`, etc.

### Use Shadcn UI Components Instead
The project has a comprehensive set of custom UI components in `src/components/ui/`:

**Available Components:**
- `Button`, `Input`, `Textarea` - Form controls
- `Modal`, `Dialog` - Overlays
- `Card` - Content containers
- `Table`, `DataTable` - Data display
- `Select`, `Dropdown`, `Checkbox`, `Switch` - Form inputs
- `Tabs`, `Accordion` - Navigation
- `Toast`, `Alert`, `Message` - Notifications
- `Tooltip`, `Popover` - Contextual info
- `Avatar`, `Badge` - Visual indicators
- `Spinner`, `Progress` - Loading states
- `Separator`, `ScrollArea` - Layout utilities

### Migration Examples
```typescript
// ❌ DON'T - Ant Design
import { Button, Input, Modal } from 'antd';

// ✅ DO - Shadcn UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
```

### Styling
- Use Tailwind CSS classes for styling
- Use the `cn()` utility from `src/lib/utils` for conditional class names
- Follow the design system patterns from existing Shadcn components
- Avoid inline styles unless absolutely necessary

### Example Component Pattern
```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function MyComponent({ variant = 'primary', className }: MyComponentProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      <Button variant={variant}>Click me</Button>
    </div>
  );
}
```

## API Integration Patterns

### API Client Structure
API calls are organized in `src/api/` by feature:
- `auth.ts` - Authentication (login, logout, register)
- `blockchain.ts` - Blockchain data (addresses, transactions, blocks)
- `compliance.ts` - Compliance operations (monitoring, screening)
- `riskScoring.ts` - Risk analysis
- `organizations.ts` - Organization management

### Making API Calls
```typescript
// Import the API function
import { getAddressInfo } from '@/api/blockchain';

// Use in component with error handling
const Component = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAddressInfo(address);
        setData(result);
      } catch (err) {
        setError(err);
        // Handle error appropriately
      }
    };

    fetchData();
  }, [address]);
};
```

### API Client Configuration
- Base URL and configuration are in `src/config/config.ts`
- API client includes automatic token management
- Error interceptors handle auth failures

## Development Workflow

### Adding a New Feature
1. Create feature directory in appropriate location (`src/views/`, `src/components/`)
2. Add API functions in `src/api/` if backend integration needed
3. Create Redux slice in `src/store/slices/` if global state needed
4. Build UI using Shadcn components from `src/components/ui/`
5. Add routing in `src/App.tsx` if new page
6. Write tests in `src/test/` or colocated `__tests__/`

### Working with State
- **Local UI state**: `useState`, `useReducer`
- **Server state**: React Query patterns or API calls with local state
- **Global app state**: Redux slices
- **Shared context**: React Context (in `src/context/`)

### Common Patterns
- Use custom hooks from `src/hooks/` for reusable logic
- Import utilities from `src/lib/` for common operations
- Use type definitions from `src/typings/` for consistency
- Follow existing component patterns in the same feature area
