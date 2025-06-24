# CLAUDE.md - Blockscout App Guide

## Application Summary
Blockscout App is a comprehensive blockchain monitoring and compliance platform built with modern web technologies:

1. **Tech Stack**:
   - React 18 with TypeScript
   - Vite as build tool
   - Redux Toolkit for state management
   - UI libraries: Tailwind CSS, Shadcn components, Lucide React
   - React Router for navigation

2. **Core Features**:
   - Compliance Screener: Monitors blockchain addresses and transactions
   - Block Explorer: Views for transactions, addresses, and blocks
   - Risk Scoring: Analytics for entity risk assessment
   - Flow Trace: Visualization of transaction flows
   - Case Management: For tracking investigations
   - Admin Dashboard: User and system management

3. **Application Structure**:
   - Protected routes requiring authentication
   - Theme support (light/dark mode)
   - Modular views organized by feature
   - Context providers for app state

## Blockscout API
The API is a Node.js/Express application written in TypeScript that serves as the backend for the Blockscout App:

1. **Architecture & Technology**:
   - Framework: Express.js with TypeScript
   - Database: MongoDB (connects to "bitcoin" and "blockscout" databases)
   - Authentication: JWT-based with refresh tokens
   - Documentation: Swagger/OpenAPI

2. **Key Features**:
   - Blockchain Data Services: Address info, transaction history, block details
   - User & Organization Management: Authentication, team management
   - Compliance Tools: Risk scoring, address monitoring, case management
   - Payment Processing: Stripe integration

3. **Database Models**:
   - User-related: User, Organization, Membership
   - Blockchain: BtcAddress, BtcTransaction, BtcBlock, BtcAttribution
   - Compliance: MonitoredAddress, ComplianceTransaction, Case

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript check first)
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run preview` - Preview production build locally

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, with noUnusedLocals and noUnusedParameters checks
- **Imports**: Use named imports for clarity, organize imports by external/internal/types
- **Components**: Use functional components with React hooks
- **Styling**: Tailwind CSS. Shadcn components. Lucide React for icons.
- **State Management**: Uses Redux Toolkit (@reduxjs/toolkit)
- **Error Handling**: Use try/catch for async operations, proper error propagation
- **Naming**:
  - Components: PascalCase
  - Functions/variables: camelCase
  - Types/interfaces: PascalCase
  - Files: PascalCase for components, camelCase for utilities
- **File Structure**: Keep related components and utilities in feature directories