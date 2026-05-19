# MCP and dev-time tooling

## MCP — dev-time only, never runtime

MCP servers are configured for Claude Code and similar dev-time tools. They are **not** used at runtime.

The Anthropic API's `mcp_servers` parameter only supports remote HTTP/SSE servers. Most useful MCP servers for UI work (21st.dev Magic, etc.) are STDIO-only and designed for local dev use. Runtime demo generation uses plain `anthropic.beta.messages.create()` calls with no MCP attached.

## Frontend components — use 21st-dev first

Always query the **21st-dev** MCP server before writing UI components from scratch. Triggers:
- Building a new component (button, modal, form, card, table, etc.)
- Restyling or restructuring an existing component
- User describes a UI element they want built

Workflow: query 21st-dev → adapt the result to fit the project's conventions (Tailwind v4, existing component patterns in `components/ui/`) → only write from scratch if 21st-dev returns nothing usable.
