# 5teen - Cyber Resilience Act (CRA) Compliance Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**Secure Software Development (E2025) - Agramkow Case Study**  
*Developed by Tomas Dracka (18.11.2025)*

---

## 📌 Project Overview

The European **Cyber Resilience Act (CRA)** mandates that software manufacturers maintain a **repeatable, documented secure development process**—not just ship secure products. This platform addresses the compliance gap by automating vulnerability tracking, deadline management, and audit-ready reporting.

### The Challenge

While SBOM generation tools are becoming standard, they only show *what's inside* the software. Most organizations lack systems to:
- **Article 15 Compliance**: Meet the 24-hour reporting requirement for discovered vulnerabilities
- **Article 14 & Annex I**: Demonstrate continuous vulnerability management and remediation evidence
- **Audit Readiness**: Transform vulnerability data into regulatory-compliant documentation

**5teen** solves this by providing an automated vulnerability lifecycle management platform.

---

## 🚀 Core Features

### 🛡️ Vulnerability Management
- **Automated OSV.dev Scanning**: Instant vulnerability detection upon SBOM upload
- **CVSS-Based Severity Mapping**: Accurate risk assessment using industry standards
- **24-Hour Deadline Tracking**: Automated CRA Article 15 compliance
- **Intelligent Version Comparison**: Auto-resolves vulnerabilities when components are upgraded
- **Lifecycle Workflow**: Track vulnerabilities through Open → Triaged → Patched → Ignored states

### 📦 SBOM Processing
- **Multi-Format Support**: CycloneDX and SPDX JSON formats
- **Version Control**: Track software changes across releases
- **Component Inventory**: Centralized view of dependencies, licenses, and authors
- **Delta Detection**: Identify new, upgraded, downgraded, and unchanged components

### 📋 Compliance & Reporting
- **Annex I Summary Reports**: One-click regulatory compliance reports
- **Real-Time KPIs**: Compliance score, remediation time, deadline adherence
- **Audit Trails**: Immutable remediation milestone tracking
- **Analytics Dashboard**: Vulnerability trends, severity distribution, time-to-fix metrics

### 🔔 Notification System
- **Email Alerts**: Resend integration for deadline warnings and new CVE notifications
- **Assignee Management**: Workload balancing across team members
- **CRA-Compliant Messaging**: Article 15 reporting requirements baked into notifications

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js Server Actions, Supabase (PostgreSQL)
- **Security**: Row Level Security (RLS), JWT authentication, middleware-based auth
- **Integrations**: OSV.dev API, NVD API (optional), Resend (email)
- **Validation**: Zod schemas for type-safe input validation
- **Error Handling**: Custom error classes, React Error Boundaries

### Professional Code Architecture
\`\`\`
lib/
├── models/               # TypeScript domain models
│   ├── vulnerability.ts
│   ├── component.ts
│   └── sbom.ts
│
├── services/             # Business logic layer
│   ├── sbom.service.ts
│   ├── vulnerability-scanner.service.ts
│   └── notification.service.ts
│
├── repositories/         # Data access layer
│   ├── vulnerability.repository.ts
│   ├── component.repository.ts
│   └── sbom.repository.ts
│
├── validators/           # Zod validation schemas
│   ├── sbom.ts
│   ├── vulnerability.ts
│   └── settings.ts
│
└── errors/               # Custom error classes
    └── index.ts
\`\`\`

### Database Schema
**Tables:**
1. `organizations` - Multi-tenant organization structure
2. `organization_members` - User-organization relationships
3. `projects` - Software projects with SBOM tracking
4. `sbom_versions` - Versioned SBOM snapshots
5. `sbom_components` - Component inventory with PURLs
6. `vulnerabilities` - CVE tracking with deadlines and assignment
7. `remediation_milestones` - Audit trail of vulnerability lifecycle
8. `compliance_reports` - Generated compliance reports
9. `user_settings` - User preferences (NVD API keys, scanning options)
10. `profiles` - Public user profiles (synced with auth.users)

**Security:**
- Advanced Row Level Security (RLS) on all tables
- Helper functions: `is_org_owner()`, `can_access_project()`, `log_remediation_milestone()`
- Optimized indexes on foreign keys and temporal columns
- `SECURITY DEFINER` functions with hardened `search_path`

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- Supabase Project
- (Optional) Resend API key for email notifications
- (Optional) NVD API key for enhanced CVSS scoring

### Installation

\`\`\`bash
# Clone repository
git clone https://github.com/tomdra01/5t.git
cd 5t

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
\`\`\`

### Environment Variables
\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Email Notifications (Optional)
RESEND_API_KEY=your_resend_api_key
NOTIFICATION_FROM_EMAIL=security@yourdomain.com

# NVD API (Optional)
NVD_API_KEY=your_nvd_api_key
\`\`\`

### Database Setup
\`\`\`bash
# Run migrations in Supabase SQL Editor
# Execute migrations 001-007 in order

# Or use Supabase CLI
npx supabase db reset
\`\`\`

### Development
\`\`\`bash
npm run dev
# Open http://localhost:3000
\`\`\`

### Production Build
\`\`\`bash
npm run build
npm start
\`\`\`

---

## 📜 CRA Compliance Coverage

- [x] **Article 15**: Automated 24-hour discovery-to-deadline tracking
- [x] **Article 14**: Continuous vulnerability monitoring and documentation
- [x] **Annex I**: Structured compliance report generation
- [x] **Email Notifications**: Timely alerts for critical vulnerabilities
- [x] **Audit Trails**: Immutable remediation milestone logs
- [x] **Multi-Format SBOM**: CycloneDX & SPDX support

---

## 🔒 Security & Code Quality

### Security Features
- **Middleware Authentication**: Active auth guard on all protected routes
- **Row Level Security**: Database-level access control
- **Input Validation**: Zod schemas on all server actions
- **Error Boundaries**: Production-ready error handling

### Code Quality Standards
- ✅ **Clean Architecture**: Service/repository pattern separation
- ✅ **Type Safety**: 100% TypeScript, zero `any` types
- ✅ **Input Validation**: Zod schemas for all external inputs
- ✅ **Error Handling**: Custom error classes and React boundaries
- ✅ **Professional Structure**: Models, services, repositories, validators
- ✅ **Production Ready**: Proper logging, error handling, security

---

## 📊 Metrics & KPIs

The platform tracks:
- **Compliance Score**: Percentage of vulnerabilities remediated within deadlines
- **Average Remediation Time**: Time from discovery to patching
- **Deadline Adherence**: Percentage of vulnerabilities meeting CRA timelines
- **Severity Distribution**: Critical/High/Medium/Low breakdown
- **Component Inventory**: Total dependencies tracked across projects

---

## 🎯 Project Goals Achieved

1. ✅ **Automated Vulnerability Discovery**: OSV.dev integration with CVSS mapping
2. ✅ **CRA Article 15 Compliance**: 24-hour deadline automation
3. ✅ **Audit-Ready Reports**: One-click Annex I summaries
4. ✅ **Multi-Tenant Support**: Organizations, projects, and team management
5. ✅ **Professional Architecture**: Service/repository patterns, validation, error handling
6. ✅ **Production Readiness**: Middleware auth, error boundaries, type safety
7. ✅ **Email Notifications**: Resend integration for compliance alerts

---

## 📝 License

MIT

---

*This project was completed as an individual case study for the Secure Software Development course (E2025) at SDU.*
