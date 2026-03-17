# Car Credit Hub - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Setup & Installation](#setup--installation)
7. [Environment Variables](#environment-variables)
8. [API Integration](#api-integration)
9. [Authentication & Authorization](#authentication--authorization)
10. [Workflow System](#workflow-system)
11. [Key Components](#key-components)
12. [Pages](#pages)
13. [Deployment](#deployment)

---

## Project Overview

**Car Credit Hub** is a comprehensive Loan Management System designed for automotive financing operations. It provides a complete solution for managing car loan applications, tracking their progress through various approval stages, and handling commissions for banks and brokers.

The system supports multi-role access with different permission levels, workflow-based loan processing, and detailed reporting capabilities.

### Key Capabilities
- End-to-end loan application management
- Multi-level approval workflow (Employee → Manager → Admin)
- Bank and broker commission tracking
- Lead management system
- Branch-based access control
- Real-time notifications
- PDF report generation
- PDD (Pre-Disbursement Document) tracking

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Library |
| TypeScript | 5.8.3 | Type Safety |
| Vite | 7.3.1 | Build Tool & Dev Server |
| Tailwind CSS | 3.4.17 | Styling |
| Radix UI | Latest | Headless UI Components |
| Shadcn/ui | Latest | UI Component Library |
| TanStack Query | 5.83.0 | Server State Management |
| React Router | 6.30.1 | Client-side Routing |
| React Hook Form | 7.61.1 | Form Management |
| Zod | 3.25.76 | Schema Validation |
| Recharts | 2.15.4 | Data Visualization |
| jsPDF | 4.2.0 | PDF Generation |
| date-fns | 3.6.0 | Date Manipulation |
| Lucide React | 0.462.0 | Icons |

### Backend (External)
- **PHP REST API** - Backend service
- **MySQL** - Database
- **Supabase** - Additional data services

### Mobile
- **Capacitor** (v8.1.0) - For mobile app builds

### Development Tools
- ESLint - Code linting
- Vitest - Testing framework
- PostCSS - CSS processing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Web App    │  │  Mobile App  │  │   Desktop    │       │
│  │   (React)    │  │ (Capacitor)  │  │  (Electron)  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼─────────────────┼────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                    API Gateway                             │
│              (PHP REST API / Backend)                      │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                   Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    MySQL     │  │   Supabase   │  │   Storage    │     │
│  │  (Primary)   │  │  (Auth/RT)   │  │   (Files)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Data Flow
1. User interacts with React frontend
2. Frontend makes API calls to PHP backend
3. Backend validates requests and queries MySQL database
4. Real-time updates via Supabase subscriptions (where applicable)
5. PDF generation happens client-side with jsPDF

---

## Project Structure

```
car-credit-hub/
├── public/                     # Static assets
│   ├── manifest.json          # PWA manifest
│   ├── robots.txt             # SEO robots file
│   └── .well-known/           # App links verification
│
├── src/
│   ├── assets/                # Images, fonts, static files
│   │
│   ├── components/             # React components
│   │   ├── ui/                # Shadcn/ui components (50+ components)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── AuthImageSlider.tsx      # Login page image carousel
│   │   ├── BankFormModal.tsx        # Bank creation/edit modal
│   │   ├── BrokerFormModal.tsx      # Broker creation/edit modal
│   │   ├── DashboardLayout.tsx      # Main app layout with sidebar
│   │   ├── LoanStatusBadge.tsx      # Status indicator component
│   │   ├── MobileBottomNav.tsx      # Mobile navigation
│   │   ├── NotificationBell.tsx     # Notification indicator
│   │   ├── PDDEditModal.tsx          # PDD editing modal
│   │   ├── PDDStatusBadge.tsx        # PDD status display
│   │   ├── RemarksModal.tsx          # Workflow remarks modal
│   │   ├── RoleAssignModal.tsx       # Role assignment UI
│   │   ├── StatCard.tsx              # Dashboard stat cards
│   │   ├── WorkflowActions.tsx       # Workflow action buttons
│   │   ├── WorkflowStatus.tsx        # Workflow status display
│   │   └── ...
│   │
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Authentication state management
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-mobile.tsx     # Mobile detection hook
│   │   └── use-toast.ts       # Toast notification hook
│   │
│   ├── integrations/          # Third-party integrations
│   │
│   ├── lib/                   # Utility functions & configurations
│   │   ├── api.ts             # API client & endpoints
│   │   ├── auth.ts            # Auth utilities
│   │   ├── constants.ts       # App constants
│   │   ├── export-utils.ts    # Data export utilities
│   │   ├── notifications.ts   # Notification helpers
│   │   ├── pdf-export.ts      # PDF generation logic
│   │   ├── permissions.ts     # Role-based permissions
│   │   ├── schemes.ts         # Loan scheme definitions
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── utils.ts           # General utilities
│   │   └── workflow.ts        # Workflow logic & actions
│   │
│   ├── pages/                 # Page components (routes)
│   │   ├── Login.tsx          # Login page
│   │   ├── Signup.tsx         # Registration page
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── Loans.tsx          # Loan list view
│   │   ├── CreateLoan.tsx     # Loan creation/editing
│   │   ├── LoanDetail.tsx     # Loan detail view
│   │   ├── UserManagement.tsx # User management
│   │   ├── BankManagement.tsx # Bank management
│   │   ├── BrokerManagement.tsx # Broker management
│   │   ├── BranchManagement.tsx # Branch management
│   │   ├── Commission.tsx     # Commission tracking
│   │   ├── Reports.tsx        # Reports & analytics
│   │   ├── AddLead.tsx        # Lead creation
│   │   ├── LeadsList.tsx      # Lead list view
│   │   ├── LeadDetail.tsx     # Lead detail view
│   │   ├── PDDTracking.tsx    # PDD tracking page
│   │   ├── BroadcastNotification.tsx # Admin notifications
│   │   ├── NotFound.tsx       # 404 page
│   │   └── ...
│   │
│   ├── test/                  # Test files
│   │   ├── example.test.ts
│   │   └── setup.ts
│   │
│   ├── App.tsx                # Main app component with routes
│   ├── main.tsx               # App entry point
│   ├── index.css              # Global styles
│   └── vite-env.d.ts          # Vite type declarations
│
├── build/                     # Build configuration
├── dist/                      # Production build output
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
├── nginx.conf                 # Nginx configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
└── README.md                  # Basic documentation
```

---

## Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Protected routes
- Session management

### 2. User Management
- Create, edit, deactivate users
- Role assignment (Admin, Manager, Employee, PDD)
- Branch assignment
- Password management

### 3. Loan Management
- Create loan applications
- Edit loan details
- View loan history
- Status tracking
- Document upload/management

### 4. Workflow System
- Multi-stage approval process
- Status transitions with validation
- Remarks and comments
- Audit trail
- Send back functionality

### 5. Bank & Broker Management
- Bank registration and details
- Broker registration
- Commission scheme configuration
- Performance tracking

### 6. Lead Management
- Lead capture
- Lead assignment
- Lead status tracking
- Conversion to loans

### 7. PDD Tracking
- Pre-disbursement document checklist
- Document verification status
- PDD approval workflow

### 8. Commission Tracking
- Commission calculations
- Payout tracking
- Reports by bank/broker
- Scheme-based calculations

### 9. Reports & Analytics
- Dashboard statistics
- Loan reports
- Export to PDF/Excel
- Visual charts and graphs

### 10. Notifications
- In-app notifications
- Broadcast notifications (Admin)
- Real-time updates
- Notification history

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- PHP Backend API (running separately)
- MySQL Database

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd car-credit-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   ```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

---

## Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_URL=http://localhost:8000/api

# Supabase (if used)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Other configurations
VITE_APP_NAME=Car Credit Hub
VITE_APP_VERSION=1.0.0
```

---

## API Integration

The frontend communicates with a PHP REST API. The API client is configured in `src/lib/api.ts`.

### API Client Features
- Automatic JWT token attachment
- Request/response interceptors
- Error handling
- Type-safe responses

### Example API Usage

```typescript
import { api } from '@/lib/api';

// Fetch loans
const loans = await api.get('/loans');

// Create loan
const newLoan = await api.post('/loans', loanData);

// Update loan
await api.put(`/loans/${id}`, updateData);

// Delete loan
await api.delete(`/loans/${id}`);
```

### Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/logout` | POST | User logout |
| `/auth/me` | GET | Get current user |
| `/loans` | GET | List all loans |
| `/loans` | POST | Create new loan |
| `/loans/:id` | GET | Get loan details |
| `/loans/:id` | PUT | Update loan |
| `/loans/:id/workflow` | POST | Workflow action |
| `/users` | GET/POST | User management |
| `/banks` | GET/POST | Bank management |
| `/brokers` | GET/POST | Broker management |
| `/leads` | GET/POST | Lead management |
| `/pdd` | GET/POST | PDD tracking |
| `/reports` | GET | Generate reports |

---

## Authentication & Authorization

### Auth Flow
1. User enters credentials on Login page
2. API validates and returns JWT token
3. Token stored in memory (context)
4. Token attached to all API requests
5. Protected routes check for valid token

### Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Admin** | System administrator | Full access to all features |
| **Manager** | Branch manager | Approve loans, manage team |
| **Employee** | Sales/Operations | Create loans, view assigned |
| **PDD** | Documentation | PDD verification, document check |

### Permission Guards
Components use permission checks to show/hide features:

```typescript
import { canApproveLoan, canEditUser } from '@/lib/permissions';

// Check if user can approve
if (canApproveLoan(user, loan)) {
  showApproveButton();
}
```

---

## Workflow System

The loan application follows a structured workflow with defined status transitions.

### Loan Statuses

```
draft → submitted → manager_review → manager_approved → admin_approved → disbursed
  ↓         ↓            ↓                ↓               ↓
sent_back_employee  sent_back_manager  sent_back_admin
  ↓
rejected / cancelled
```

### Status Definitions

| Status | Description |
|--------|-------------|
| `draft` | Initial state, being prepared by employee |
| `submitted` | Submitted for manager review |
| `manager_review` | Under manager review |
| `manager_approved` | Approved by manager, pending admin |
| `admin_approved` | Fully approved, ready for disbursement |
| `disbursed` | Loan amount disbursed |
| `sent_back_employee` | Returned to employee for corrections |
| `sent_back_manager` | Returned to manager for review |
| `sent_back_admin` | Returned to admin for review |
| `rejected` | Application rejected |
| `cancelled` | Application cancelled |

### Workflow Actions

Available actions depend on user role and current status:

- **Submit** (draft → submitted)
- **Approve** (manager_review → manager_approved)
- **Admin Approve** (manager_approved → admin_approved)
- **Send Back** (with remarks)
- **Reject** (terminal state)
- **Cancel** (terminal state)

### Audit Trail
All workflow transitions are logged with:
- User who performed action
- Timestamp
- From/To status
- Remarks/comments

---

## Key Components

### DashboardLayout
Main application layout with:
- Responsive sidebar navigation
- Top header with user info
- Mobile bottom navigation
- Notification bell

### WorkflowActions
Dynamic action buttons based on:
- Current loan status
- User role
- Available transitions

### LoanStatusBadge
Visual status indicator with color coding:
- Green: Approved/Disbursed
- Yellow: In Review
- Blue: Draft/Submitted
- Red: Rejected/Cancelled
- Orange: Sent Back

### StatCard
Dashboard statistic cards with:
- Icon
- Value
- Label
- Trend indicator

### PDDEditModal
Modal for editing PDD information:
- Document checklist
- Verification status
- Remarks

---

## Pages

### Public Pages
- **Login** (`/login`) - User authentication
- **Signup** (`/signup`) - User registration

### Protected Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Main dashboard with stats |
| Loans | `/loans` | List all loans |
| Create Loan | `/loans/new` | Create new loan |
| Loan Detail | `/loans/:id` | View loan details |
| Edit Loan | `/loans/:id/edit` | Edit existing loan |
| Users | `/users` | User management |
| Banks | `/banks` | Bank management |
| Brokers | `/brokers` | Broker management |
| Branches | `/branches` | Branch management |
| Commission | `/commission` | Commission tracking |
| Reports | `/reports` | Reports & analytics |
| Add Lead | `/add-lead` | Create new lead |
| Leads List | `/leads-list` | View all leads |
| Lead Detail | `/leads/:id` | Lead information |
| PDD Tracking | `/pdd-tracking` | PDD management |
| Broadcast | `/broadcast` | Send notifications |

---

## Deployment

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t car-credit-hub .
   ```

2. **Run container**
   ```bash
   docker run -p 80:80 car-credit-hub
   ```

3. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Serve the `dist` folder using any static server:
   ```bash
   # Using nginx
   cp -r dist/* /var/www/html/

   # Or using serve
   npx serve dist
   ```

### Coolify Deployment

The project includes a `Dockerfile` for easy deployment on Coolify:

1. Connect your Git repository to Coolify
2. The Dockerfile will be auto-detected
3. Configure environment variables
4. Deploy

### Nginx Configuration

The included `nginx.conf` provides:
- Static file serving
- SPA routing (fallback to index.html)
- Gzip compression
- Security headers

---

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React hooks best practices
- Use Tailwind CSS for styling
- Component names in PascalCase
- Utility functions in camelCase

### Component Structure
```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface Props {
  title: string;
}

// Component
export function ComponentName({ title }: Props) {
  // State
  const [count, setCount] = useState(0);

  // Handlers
  const handleClick = () => setCount(c => c + 1);

  // Render
  return (
    <div className="p-4">
      <h1>{title}</h1>
      <Button onClick={handleClick}>Count: {count}</Button>
    </div>
  );
}
```

### Adding New Features
1. Create types in `src/lib/types.ts`
2. Add API functions in `src/lib/api.ts`
3. Create components in `src/components/`
4. Add pages in `src/pages/`
5. Update routing in `src/App.tsx`
6. Add permissions if needed in `src/lib/permissions.ts`

---

## Testing

### Running Tests
```bash
# Run once
npm run test

# Watch mode
npm run test:watch
```

### Test Structure
Tests are located in `src/test/` directory using Vitest and React Testing Library.

---

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
- Run `npm run lint` to check for errors
- Ensure all types are properly defined

**API calls failing**
- Check `VITE_API_URL` in `.env`
- Verify backend API is running
- Check browser console for CORS errors

**Styles not applying**
- Ensure Tailwind classes are valid
- Check `tailwind.config.ts` for custom colors

**Mobile layout issues**
- Test with browser dev tools mobile view
- Check responsive breakpoints

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

## License

[Your License Here]

---

## Contact

**Developer:** Yogendra Singh (RoastCoder)
- GitHub: [@RoastCoder](https://github.com/RoastCoder)
- Organization: StandaloneCoders

---

*Last Updated: March 2026*
