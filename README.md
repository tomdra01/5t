# 5teen - CRA Compliance Management Platform

**Secure Software Development (E2025) - Case Study**
*Developed by Tomas Dracka*

## Overview

5teen is a compliance management platform built to address the requirements of the European Cyber Resilience Act (CRA). While SBOM generation tools tell you what's in your software, they don't help you manage the vulnerabilities found within those components. This platform bridges that gap by automating vulnerability tracking, deadline management, and compliance reporting.

The CRA requires software manufacturers to maintain a documented, repeatable secure development process. Article 15 mandates reporting actively exploited vulnerabilities within 24 hours of discovery. Article 14 requires continuous vulnerability management with evidence of remediation efforts. Most organizations lack the infrastructure to meet these requirements systematically. 5teen provides that infrastructure.

<img width="2672" height="1444" alt="Snímka obrazovky 2026-01-20 o 21 40 40" src="https://github.com/user-attachments/assets/0949c84d-07e6-45ce-98ad-4986d91777b8" />

## What It Does

The platform accepts SBOM files in CycloneDX or SPDX JSON format. Upon upload, it scans each component against the OSV.dev vulnerability database. When vulnerabilities are discovered, the system creates tracking records with automatically calculated deadlines based on CRA requirements. The default deadline is 24 hours from discovery, matching Article 15's reporting timeline.

Each vulnerability moves through a defined lifecycle: discovered, in remediation, resolved, or ignored. The system tracks status changes, assigns ownership to team members, and monitors whether deadlines are met. When a vulnerability passes its reporting deadline without being addressed, it's automatically marked as ignored with a timestamped audit trail.

The platform provides real-time visibility into your compliance posture through a dashboard showing key metrics: total vulnerabilities, those actively being remediated, critical severity counts, and compliance scores based on deadline adherence. Analytics charts track vulnerability trends over time, severity distributions, and average remediation durations.

When components are updated in subsequent SBOM uploads, the system performs intelligent version comparison. If a component version increases, any open vulnerabilities associated with the old version are automatically resolved. This automates a significant portion of the remediation tracking burden.

Compliance reports can be generated with a single click. These reports summarize your vulnerability management efforts in a format suitable for regulatory documentation, including statistics on discovery rates, remediation times, and deadline adherence percentages.

## Technical Architecture

The application is built with Next.js 16 using the App Router architecture and React Server Components. The backend uses Supabase for PostgreSQL database management with Row Level Security policies enforcing multi-tenant data isolation. Server Actions handle all data mutations with Zod validation schemas ensuring type-safe inputs.

The codebase follows a clean architecture pattern with clear separation of concerns. Domain models define the core business entities. Services contain business logic and orchestrate operations across multiple repositories. Repositories handle all database access, abstracting the data layer from business logic. Validators use Zod schemas to ensure data integrity at the boundaries.

Authentication uses Supabase Auth with JWT tokens. Middleware protects routes, ensuring only authenticated users access the application. Database RLS policies provide defense in depth, preventing unauthorized data access even if application-level checks fail.

## Key Features

**Vulnerability Management:** Automatic scanning via OSV.dev API upon SBOM upload. CVSS-based severity classification. Status workflow tracking from discovery through resolution. Automatic deadline calculation and monitoring. Team member assignment for workload distribution.

<img width="2672" height="1444" alt="Snímka obrazovky 2026-01-20 o 21 40 58" src="https://github.com/user-attachments/assets/7eb60757-1cfb-4a17-ba45-d42577ccd20e" />

**SBOM Processing:** Multi-format support for CycloneDX and SPDX JSON. Version control tracking software evolution over time. Component inventory with license and author information. Delta detection identifying new, upgraded, downgraded, and unchanged components between versions.

<img width="2672" height="1444" alt="Snímka obrazovky 2026-01-20 o 21 40 49" src="https://github.com/user-attachments/assets/455583f6-799e-497d-b5a4-149b5b7e99ef" />

**Compliance Reporting:** Annex I summary reports generated on demand. Real-time KPIs including compliance scores and remediation times. Audit trails with immutable milestone logging. Analytics visualizations for vulnerability trends and severity distributions.

<img width="2672" height="1444" alt="Snímka obrazovky 2026-01-20 o 21 41 39" src="https://github.com/user-attachments/assets/d4c4aea5-65a7-44f9-8f4e-ddd844c9c9f0" />

**Automation:** Automatic status changes for past-deadline vulnerabilities. Automatic resolution when component versions are upgraded. Automated CVSS scoring and severity mapping. Optional integration with NVD API for enhanced vulnerability details.

<img width="2672" height="1444" alt="Snímka obrazovky 2026-01-20 o 21 41 29" src="https://github.com/user-attachments/assets/8afb3572-b03e-4cb9-b8ec-185902c9bdbe" />
<img width="2672" height="1444" alt="Snímka obrazovky 2026-01-20 o 21 41 24" src="https://github.com/user-attachments/assets/6944ab33-cb66-43ee-87d5-4d7db2bb57a8" />

## Setup

You'll need Node.js v18 or higher and a Supabase project. Email notifications require a Resend API key, though this is optional and the system functions without it. Enhanced vulnerability scoring can use an NVD API key, also optional.

Clone the repository and install dependencies with npm install. Copy the .env.example file to .env.local and configure your environment variables. At minimum, you need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project settings.

Database setup requires running the migration files in the supabase/migrations directory. Execute them in numerical order through the Supabase SQL Editor, or use the Supabase CLI with `npx supabase db reset` if you have the CLI configured locally.

For development, run `npm run dev` and open http://localhost:3000. For production deployment, build with `npm run build` and start with `npm start`. The application is compatible with Vercel, Netlify, or any platform supporting Next.js.

## Environment Configuration

```env
# Required - Supabase connection
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - Email notifications
RESEND_API_KEY=your_resend_api_key
NOTIFICATION_FROM_EMAIL=security@yourdomain.com

# Optional - Enhanced vulnerability data
NVD_API_KEY=your_nvd_api_key
```

## Database Schema

The schema consists of ten main tables. Organizations provide multi-tenant structure with organization_members defining user-organization relationships. Projects belong to organizations and contain SBOM versions. Each SBOM version snapshot links to components, which in turn link to vulnerabilities. Remediation milestones create an audit trail of vulnerability lifecycle events. Compliance reports store generated documentation. User settings manage preferences like API keys. Profiles mirror auth.users for public profile information.

All tables have Row Level Security policies enforcing access control at the database level. Helper functions like can_access_project() and is_org_owner() encapsulate authorization logic. Indexes optimize common query patterns, particularly for foreign key relationships and temporal queries.

## CRA Compliance Coverage

The platform addresses Article 15's 24-hour reporting requirement through automated deadline tracking and notifications. Article 14's continuous vulnerability monitoring is satisfied through the lifecycle management system with full audit trails. Annex I compliance reporting is handled via one-click report generation. Email notifications ensure timely response to critical vulnerabilities. The immutable remediation milestone logs provide evidence for regulatory audits.

## Code Quality Standards

The codebase maintains 100% TypeScript coverage with no any types. All external inputs pass through Zod validation schemas. Custom error classes provide meaningful error messages while React Error Boundaries handle runtime failures gracefully. The service/repository pattern separates business logic from data access. Middleware authentication guards all protected routes. Database RLS provides defense in depth for data security.

## License

MIT

---

*This project demonstrates a production-ready approach to CRA compliance automation, completed as part of the Secure Software Development course at EASV.*
