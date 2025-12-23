# 5teen - CRA Compliance & Vulnerability Management Tool

## Project Overview
**Course:** Secure Software Development (E2025)
**Student:** Tomas Dracka
**Date:** 18.11.2025

## Problem Statement
The European Cyber Resilience Act (CRA) introduces strict requirements for manufacturers of products with digital elements. While many companies can generate an SBOM (Software Bill of Materials) to show *what* is inside their software, they often lack the systems to manage what comes *after*:
*   **Article 14**: Reporting actively exploited vulnerabilities within 24 hours.
*   **Article 15**: Documenting vulnerability handling and remediation.
*   **Annex I**: Proving continuous vulnerability management.

This project addresses the gap between simple SBOM generation and full CRA compliance. Agramkow, like many companies, needs a dedicated workflow to transform these legal obligations into an integrated part of the development process.

## Solution: 5teen
5teen is a lightweight, dedicated CRP (Cyber Resilience Platform) designed to:
1.  **Ingest SBOMs**: Upload CycloneDX files to create a searchable inventory of components.
2.  **Automate Triage**: Automatically scan components for vulnerabilities (via OSV.dev) and calculate reporting deadlines (e.g., 24h from discovery).
3.  **Manage Responsibility**: Assign vulnerabilities to specific developers to ensure accountability.
4.  **Track Remediation**: Log status changes (Open -> In Remediation -> Resolved) and remediation notes.
5.  **Audit Compliance**: Generate "Annex I Summary" reports to prove to regulators that a repeatable security process is in place.

## Features
*   **SBOM Portal**: Drag-and-drop upload with duplicate detection and automated vulnerability scanning.
*   **Interactive Triage Board**:
    *   View all active vulnerabilities.
    *   Sort by Severity (Critical, High, etc.) or Deadline.
    *   Assign owners and update status.
*   **Audit Center**:
    *   Generate compliance snapshots.
    *   View a history of all reports for audit trails.
    *   Track compliance status (Compliant/Non-Compliant) based on recent activity.

## Tech Stack
*   **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons.
*   **Backend**: Supabase (PostgreSQL) for relational data and real-time updates.
*   **Security**: Row Level Security (RLS) enabled on all database tables.
*   **Integration**: OSV.dev API for live vulnerability data.

## Getting Started
1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    pnpm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
4.  **Open** [http://localhost:3000](http://localhost:3000) in your browser.
