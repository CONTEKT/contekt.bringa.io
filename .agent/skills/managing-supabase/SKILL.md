---
name: managing-supabase
description: Manages Supabase resources including migrations, schema files, and edge functions. Use when the user asks to update the database, modify the schema, or work with Supabase.
---

# Managing Supabase Skill

This skill provides guidelines and workflows for managing the Supabase setup in the project, ensuring consistency between migrations, the schema file, and the live database.

## When to use this skill
- User asks to modify the database schema (tables, columns, types).
- User asks to add or update Supabase Edge Functions.
- User asks to reflect database changes in the project files.

## Workflow

1.  **Context Retrieval (CRITICAL)**
    -   **Always** use `Context7` to retrieve the full Supabase documentation/context before performing any actions efficiently.

2.  **Schema & Migrations**
    -   Keep migrations in the project up-to-date.
    -   **Update `supabase/schema.sql`**: If the schema changes, you MUST update `supabase/schema.sql` so the database can be rebuilt from scratch at any time.
    -   **Include Triggers & Functions**: Ensure `schema.sql` includes all Database Triggers and Functions updates.

3.  **Edge Functions**
    -   Modify Edge Functions (`supabase/functions/`) **only when necessary**.
    -   Avoid unnecessary changes to functional logic unless explicitly requested.

4.  **Tools**
    -   **Primary**: Use the **Supabase MCP Server** tools (e.g., `mcp_apply_migration`, `mcp_execute_sql`) to interact with the database directly.

## Instructions

-   **Context7**: Verification of documentation is the first step.
-   **Schema Consistency**: The `supabase/schema.sql` file is the source of truth. It must never drift from the actual migrations.
-   **MCP Usage**: Always attempt to use the Supabase MCP server for deployments and queries. Manual SQL execution in the dashboard should be a last resort.
