# 5teen - Cyber Resilience Act (CRA) Compliance Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Secure Software Development (E2025) - Agramkow Case Study**  
*Developed by Tomas Dracka (18.11.2025)*

---

## 📌 Context & Problem Statement

The European **Cyber Resilience Act (CRA)** introduces a transformative legal framework for software manufacturers. It shifts the focus from simply shipping "secure products" to maintaining a **repeatable, documented secure development process**.

### The Compliance Gap
While tools to generate **SBOMs (Software Bill of Materials)** are becoming common, they only reveal *what* is inside the software at a single point in time. Most companies lack the infrastructure to:
*   **Article 15 Compliance**: Fulfill the stringent **24-hour reporting requirement** for discovered vulnerabilities.
*   **Article 14 & Annex I**: Demonstrate continuous vulnerability management, responsibility assignment, and remediation evidence to regulators.
*   **Audit Readiness**: Transform raw vulnerability data into audit-ready documentation that proves a consistent security posture.

**5teen** bridges this gap by providing a lightweight, automated platform for vulnerability lifecycle management.

---

## 🚀 Key Features

### 🛡️ Vulnerability Triage & Lifecyle
*   **Automated Scanning**: Instant vulnerability detection via OSV.dev integration upon SBOM upload.
*   **CRA Article 15 Automation**: Automatic calculation of the **24-hour reporting deadline** for every new discovery.
*   **Responsibility Tracking**: Assign vulnerabilities to developers and track remediation progress with a structured audit trail.
*   **Flexible Status Management**: Track vulnerabilities through states: `Open`, `Triaged`, `Patched`, and `Ignored`.

### 📦 SBOM Management
*   **Multi-Format Ingestion**: Supports CycloneDX (JSON) and SPDX imports.
*   **Versioning**: Tracks software changes over time, allowing for delta-tracking of vulnerabilities between releases.
*   **Component Inventory**: Provides a centralized view of all software components, licenses, and authors.

### 📋 Audit & Compliance Center
*   **Annex I Summaries**: One-click generation of compliance reports summarizing security posture for regulators.
*   **Audit Trails**: Immutable logs of remediation milestones (status changes, notes, and fixes).
*   **KPI Dashboard**: Monitor open vulnerabilities, average remediation time, and deadline compliance percentages.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS.
- **Backend & Security**:
    - **Supabase (PostgreSQL)**: Optimized schema with relational integrity.
    - **Advanced RLS**: Highly performant Row Level Security with sub-query optimization.
    - **Security Hardening**: Secure `search_path` functions and hardened extension schemas.
- **Integrations**:
    - **OSV.dev API**: Distributed vulnerability database.
    - **CycloneDX/SPDX**: Industry-standard SBOM formats.

---

## 🏗 Database Architecture

The system relies on a robust schema designed for scale and auditability:
1.  **Organizations & Projects**: Multi-tenant structure ensuring data isolation.
2.  **SBOM Versions**: Snapshot-based component tracking.
3.  **Vulnerabilities & Milestones**: A parent-child relationship that preserves the full history of a vulnerability's remediation lifecycle (CRA Annex I Requirement).
4.  **Scan Queue**: Asynchronous processing queue for high-volume vulnerability scans.

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Supabase Project

### 2. Setup
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Initialization
Copy the migration scripts from `/supabase/migrations` (001-003) to your Supabase SQL Editor or run:
```bash
npx supabase db reset
```

### 4. Run Development
```bash
npm run dev
```

---

## 📜 CRA Compliance Roadmap
- [x] **Article 15**: Automated 24-hour discovery-to-deadline tracking.
- [x] **Article 14**: Continuous monitoring and documentation of vulnerability status.
- [x] **Annex I**: Structured report generation for regulatory evidence.
- [ ] **Coming Soon**: Vulnerability Disclosure Policy (VDP) portal integration.

---
*This project was completed as an individual case study for the Secure Software Development course (E2025).*
