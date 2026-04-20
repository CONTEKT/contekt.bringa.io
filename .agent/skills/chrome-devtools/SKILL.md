---
name: chrome-devtools
description: Controls, automates, and debugs Chrome using the chrome-devtools MCP server. Use for any task requiring browser interaction, scraping, UI inspection, or performance analysis.
---

# Chrome DevTools

## When to use this skill
- When you need to automate browser tasks (filling forms, clicking buttons).
- When debugging UI/UX issues, console errors, or network requests.
- When performing technical audits (performance, accessibility).
- When scraping data that requires JavaScript execution.

## Choosing the Right Tool (MCP vs. Subagent)

Always choose the best tool for the specific task at hand:

### Use **Chrome DevTools (MCP)** when:
- **Technical Audits**: You need performance traces, lighthouse reports, or detailed metrics (LCP, CLS).
- **Deep Inspection**: You need to see network request headers, console messages, or the accessibility tree.
- **Precise Debugging**: You are troubleshooting a specific bug on a known page.
- **Low-Level Control**: You need to emulate network conditions or CPU throttling.

### Use **Browser Subagent** when:
- **Complex Workflows**: The task involves multiple steps, searches, or navigating across several different sites.
- **Visual Verification**: You want to provide the user with a video recording (`.webp`) of the actions taken.
- **Heuristic Search**: The task requires "human-like" reasoning to find content or navigate ambiguous menus.
- **General Browsing**: Researching topics or gathering information from the public web.

## Workflow

1.  **Validate Connection**: Ensure Chrome is running with `--remote-debugging-port=9222`.
2.  **Navigation**: Open a new page or navigate to a URL.
3.  **Interaction**: Find elements using snapshots and interact with them (click, fill).
4.  **Inspection**: Check console logs, network requests, or accessibility trees.
5.  **Analysis**: Optionally run performance traces or emulation as needed.

## Instructions

### 1. Connection Check
Before using any tools, verify the browser is reachable:
```bash
bash .agent/skills/chrome-devtools/scripts/check-connection.sh
```

### 2. Common Operations

#### Navigation and Snapshots
Always take a snapshot after navigation to understand the page structure and get element UIDs.
- `mcp_chrome-devtools_new_page(url="...")`
- `mcp_chrome-devtools_take_snapshot()`

#### Working with Elements
Use UIDs from the snapshot for interactions:
- `mcp_chrome-devtools_click(uid="...")`
- `mcp_chrome-devtools_fill(uid="...", value="...")`

#### Debugging and Monitoring
Check what's happening under the hood:
- `mcp_chrome-devtools_list_console_messages()`
- `mcp_chrome-devtools_list_network_requests()`

#### Performance and Trace
For speed analysis:
- `mcp_chrome-devtools_performance_start_trace(reload=true, autoStop=true)`
- `mcp_chrome-devtools_performance_analyze_insight(...)`

## Resources
- [check-connection.sh](scripts/check-connection.sh)
