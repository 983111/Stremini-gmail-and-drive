# Stremini Workspace — The Complete Architectural Design & Mobile App Blueprint

Welcome to the **Stremini Workspace** specifications and blueprint document. This README details the exact functionality, system flows, API endpoints, data models, and Gemini AI configurations of the workspace. Use this guide as a direct technical blueprint to implement a replica of Stremini Workspace as a high-fidelity mobile application (e.g., using Flutter or React Native).

---

## 📱 Mobile Architecture Core Recommendations

When translating this web application into a native mobile workspace (iOS & Android), structure your application with the following equivalents:
- **Authentication**: Use `react-native-app-auth` or Flutter's `flutter_appauth` to handle standard Google OAuth loops and securely store the Google OAuth `accessToken` and Firebase Token inside the device keychain.
- **Offline Sync & Caching**: Use local databases (e.g., SQLite, Hive, WatermelonDB, or Firestore Offline Persistence) to buffer and index documents/records for high-performance offline lookup and mobile search indexing, mirroring Stremini's client-side global workspace search.
- **REST APIs**: Interface directly with Google REST endpoints (Gmail API, Drive API) via authenticated HTTP client layers rather than heavyweight client SDK Web wrappers.

---

## 🛠 Tech Stack Overview

### 1. Unified Interface
- **UI & Layout**: High-contrast, premium light-themed design leveraging strict, crisp, modern grid alignments and deliberate visual rhythm.
- **Typography Matrix**:
  - Display / Core Headers: `Inter` or `Space Grotesk` (clean, tech-forward, tracking-tight).
  - Raw Data & Secondary Metadata: `JetBrains Mono` or `Fira Code` (for sizes, timestamps, owners, and indexes).

### 2. Live Cloud Integrations & Storage
- **Identity Provider**: Firebase Auth + Client-side Google OAuth 2.0 flow.
- **Real-time Database**: Firebase Firestore (multi-tenant hierarchical database structures).
- **Intelligent Engine**: Google Gemini Generative AI (`gemini-3.5-flash` for high-speed dynamic generation, custom prompt parameters).
- **Core Integrations**:
  - Google Drive REST API v3
  - Google Forms REST API v1
  - Google Slides REST API v1
  - Google Gmail REST API v1
  - Google Contacts APIs

---

## 🗄 Firestore Data Schemas

Firestore is grouped hierarchically under individual user profiles to guarantee strong tenant isolation:

### 1. Documents Custom Collection
- **Path**: `users/{userId}/documents/{docId}`
- **Field Blueprint**:
  ```json
  {
    "id": "String (Document UUID)",
    "title": "String (e.g., 'Q3 Marketing Objectives')",
    "content": "String (Rich Markdown body content)",
    "updatedAt": "Timestamp / Date String",
    "createdAt": "Timestamp / Date String"
  }
  ```

### 2. Databases & Core Schemas
- **Path**: `users/{userId}/databases/{dbId}`
- **Field Blueprint**:
  ```json
  {
    "id": "String (Database ID)",
    "name": "String (e.g., 'Sprint Feature Backlog')",
    "schema": "String (JSON Stringified array containing columns definitions)",
    "createdAt": "Timestamp",
    "updatedAt": "Timestamp"
  }
  ```
  - **Column Meta-Definition (JSON inside Schema)**:
    ```typescript
    interface DbSchema {
      key: string;       // Camel-case unique field key (e.g., "startDate")
      name: string;      // Human-readable title label (e.g., "Start Date")
      type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
      options?: string[]; // Defined if type is 'select' (e.g., ["High", "Medium", "Low"])
    }
    ```

### 3. Database Records Grid
- **Path**: `users/{userId}/databases/{dbId}/records/{recordId}`
- **Field Blueprint**:
  ```json
  {
    "id": "String (Row Record UID)",
    "title": "String (First column primary text representation)",
    "properties": "String (JSON Stringified object mapping keys to values)",
    "order": "Number (Used for custom draggable row-sorting sequences)"
  }
  ```
  - **Properties Representation (JSON inside Record)**:
    ```json
    {
      "key_text": "Task Title Sample",
      "priority_select": "High",
      "isDone_checkbox": true,
      "dateValue_date": "2026-05-24"
    }
    ```

---

## ⚡ Feature-by-Feature Functional Specification

### 1. Global Workspace Search (The Search Core)
The primary search input indexes three discrete services concurrently. High performance is maintained by loading document and schema indexes into a local memory cache on initial focus:
*   **Locally Memory-Cached Matches**:
    *   **Documents**: Checks if query matches the document `title` or anywhere inside the body `content`.
    *   **Databases**: Matches database table `name` or custom column fields.
    *   **Database Records**: Scrapes the row primary title and every single object value stored inside the record `properties` structure.
*   **Live Gmail Api Indexing**: Queries the active user inbox over HTTP via `fetchRecentEmails(accessToken, query)` sending the user query directly to Google Gmail servers.
*   **Unified UI Render Output**:
    *   Interactive filtering tabs allow the user to pivot results by: `All`, `Documents`, `Databases`, or `Gmail`.
    *   Matches are visually marked utilizing real-time regex highlighting (wrapping terms in highlighted HTML tags).
    *   Keyboard navigation supports `ArrowUp`, `ArrowDown`, and `Enter` shortcut selections to jump instantly to document editors, database viewers, or details pages using router queries such as `/mail?id=X`.

### 2. Intelligent Document Studio
A side-by-side editing panel enabling markdown previewing and real-time AI revision loops:
*   **Local State Persistence**: Instant local state commits prevent unsaved content losses.
*   **AI Sidekick Sidebar**: Includes an integrated chat block with custom system-prompt behaviors.
*   **Advanced Export Options**: Generates structured, high-fidelity PDF documents from Markdown content on-the-fly.

### 3. Database Engine & Custom Schemas
A workspace table workspace enabling relational, structured database layouts:
*   **CRUD Schema Customizer**: Create fields dynamically using individual widgets for columns.
*   **Inline Cell Editing**: Seamless state management allows changes to database text, numbers, select toggles, date-pickers, and checkbox states directly in the spreadsheet view.
*   **AI Auto-Generation (The Planner)**: Users outline database intentions in natural language (e.g., "Create an inventory tracking sheet for heavy machinery"). The AI engine generates:
    1.  A precise, relational list of custom column structures (`DbSchema[]`).
    2.  An array of simulated entries (5 to 50 rows of data mirroring realistic fields) automatically popped into Firestore.

### 4. Smart Google Drive Sync & Advanced Filter Matrix
A full cloud file browser connecting local actions to Google Drive REST API endpoints:
*   **Hierarchical Navigation**: Simple directory tree traversals utilizing parent IDs.
*   **Advanced Filter Panel**:
    *   *By File Type*: Scope list to Google Docs, Gmail attachments, Spreadsheets, Slides, Folders, PDF Documents, or Images.
    *   *By Owner*: Filter to only show items owned by `me` or specified external user emails.
    *   *By Dates*: Pre-defined range buckets ("Today", "Last 7 days", "Last 30 days", "Last year") or exact custom start/end date constraints.
    *   *Boundary Toggles*: Ability to constrain searches strictly within the current sub-folder or search globally.
*   **AI PDF & Doc Analyzer**:
    *   Uses a multi-part boundary stream payload upload block to fetch Drive content.
    *   For PDFs, downloads raw binary blobs, converts contents to Base64 in-memory, and sends them to Gemini models alongside an structured executive prompt.
    *   Creates detailed Markdown analysis with **Executive Summary**, **Key Takeaways & Points**, and **Action Items** matrices.

### 5. Gmail Cloud Reader
An active client for Google Mail accounts:
*   **Query-Optimized Indexing**: Loads inbox threads instantly via Gmail HTTP rest endpoints.
*   **Conversational Summarization**: Resolves long back-and-forth email chains into comprehensive summaries of key events and decisions with Gemini.

---

## 🧠 Gemini Prompts & Configuration Settings

Your workspace AI connections use the following configurations:

### 1. Database Schema Generation Prompt
```text
Role: Database Architect and Systems Analyst
Goal: Generate a production-ready Firestore-compatible database schema and mock records based on the user's requirements.
Output Format: Strict JSON document matching this exact TypeScript shape:
{
  "name": "String table name",
  "schema": DbSchema[],
  "records": Array<Record<string, any>> // 15-30 records containing mock data matching properties
}
```

### 2. PDF & Document Executive Summary Prompt
```text
Model: gemini-3.5-flash
Prompt:
"Analyze this document and provide a highly detailed, professional analysis. Extensively outline and extract the following sections in well-formatted, professional markdown:

## Executive Summary
[Overview of the document]

## Key Points & Takeaways
[Principal themes and details]

## Action Items
[Who, what, and when. If none, logical steps based on text]

Use professional executive vocabulary. Don't omit key indicators."
```

---

## 🔑 Required API Scopes Reference

To construct deep mobile native permissions requests, you must seek authorization for these Google OAuth Scopes:
-   `https://www.googleapis.com/auth/userinfo.profile`
-   `https://www.googleapis.com/auth/userinfo.email`
-   `https://www.googleapis.com/auth/drive.readonly`
-   `https://www.googleapis.com/auth/drive.file`
-   `https://www.googleapis.com/auth/forms.body`
-   `https://www.googleapis.com/auth/gmail.readonly`

---

*Stremini Workspace — Form meets function in the future of work.*
