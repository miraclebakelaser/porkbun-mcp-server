# Porkbun MCP Server Installation Guide

This guide is specifically designed for AI agents like Cline to install and configure the Porkbun MCP server for use with LLM applications like Claude Desktop, Claude Code, Cursor, Cline, Kiro, Roo Code, and Windsurf.

## Overview

The Porkbun MCP server provides tools to interact with the Porkbun API, allowing AI assistants to manage domains, DNS records, SSL certificates, and more directly within your Porkbun account.

## Prerequisites

Before installation, you need:

1.  **Node.js:** Version 18.0.0 or higher.
2.  **Bun:** (Recommended over npm/yarn for this project).
3.  **Porkbun API Keys:**
    *   `PORKBUN_API_KEY`
    *   `PORKBUN_SECRET_API_KEY`
    You can obtain these from your Porkbun account API settings.
4.  **Project Code:** You need a local copy of the `porkbun-mcp-server` code (e.g., via `git clone`).

## Installation and Configuration

1.  **Navigate to Project Directory:**
    Open your terminal and change to the directory where you cloned `porkbun-mcp-server`.
    ```bash
    cd /path/to/porkbun-mcp-server
    ```

2.  **Install Dependencies:**
    ```bash
    bun install
    ```

3.  **Build the Server:**
    ```bash
    bun run build
    ```
    This compiles the TypeScript code into JavaScript in the `build/` directory.

4.  **Configure API Keys:**
    The server requires your Porkbun API keys. You have two options:
    *   **Environment Variables:** Set `PORKBUN_API_KEY` and `PORKBUN_SECRET_API_KEY` as environment variables in the system where your LLM client runs the MCP server.
    *   **.env File:** Create a `.env` file in a secure location (e.g., `~/.config/porkbun-mcp/.env`) with the following content:
        ```dotenv
        PORKBUN_API_KEY=YOUR_API_KEY_HERE
        PORKBUN_SECRET_API_KEY=YOUR_SECRET_API_KEY_HERE
        ```
        You will then need to provide the path to this file in the MCP configuration (see below). **Do not commit this file to Git.**

5.  **Configure MCP Settings:**
    Add the Porkbun MCP server configuration to your MCP settings file based on your LLM client.
    
    **Important Notes:**
    - Each client has different configuration formats and features
    - Some clients support both local (STDIO) and remote (SSE/HTTP) servers
    - Environment variables handling varies by client
    - Always use absolute paths for file references

    #### Configuration File Locations

    **Claude Desktop:**
    - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
    - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
    - Access via: Claude Desktop → Settings → Developer → Edit Config

    **Claude Code:**
    - Project scope: `.mcp.json` in project root
    - User scope: Managed by `claude mcp add` command
    - Local scope: Project-specific user settings (not shared)

    **Cursor:**
    - Project-specific: `.cursor/mcp.json` in project root
    - Global: `~/.cursor/mcp.json` in home directory
    - Access via: Command Palette → "cursor settings" → MCP section

    **Cline (VS Code Extension):**
    - macOS: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
    - Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
    - Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
    - Access via: Cline's "MCP Servers" icon in top navigation

    **Roo Code (VS Code Extension):**
    - Global: Same path as Cline but with `rooveterinaryinc.roo-cline` instead of `saoudrizwan.claude-dev`
    - Project: `.roo/mcp.json` in project root
    - Access via: Roo Code settings icon → "Edit Global MCP"

    **Kiro:**
    - Workspace: `.kiro/settings/mcp.json` (project-specific)
    - User: `~/.kiro/settings/mcp.json` (global)
    - Access via: Kiro panel → Edit button next to MCP

    Add or merge this configuration into your chosen client's settings file. **Each client has a slightly different format - see client-specific examples below.**

## Client-Specific Configuration Examples

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "porkbun-server": {
      "command": "node",
      "args": [
        "/path/to/porkbun-mcp-server/build/index.js"
      ],
      "env": {
        "PORKBUN_API_KEY": "YOUR_API_KEY",
        "PORKBUN_SECRET_API_KEY": "YOUR_SECRET_API_KEY"
      }
    }
  }
}
```

**Note:** Claude Desktop only supports local STDIO servers. Environment variables must be defined in the config file.

### Cursor Configuration

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "porkbun-server": {
      "command": "node",
      "args": [
        "/path/to/porkbun-mcp-server/build/index.js"
      ],
      "env": {
        "PORKBUN_API_KEY": "YOUR_API_KEY",
        "PORKBUN_SECRET_API_KEY": "YOUR_SECRET_API_KEY"
      }
    }
  }
}
```

**Note:** Cursor supports both STDIO and SSE transports. Maximum 40 tools can be active simultaneously.

### Cline Configuration

Add to `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "porkbun-server": {
      "command": "node",
      "args": [
        "/path/to/porkbun-mcp-server/build/index.js"
      ],
      "env": {
        "PORKBUN_API_KEY": "YOUR_API_KEY",
        "PORKBUN_SECRET_API_KEY": "YOUR_SECRET_API_KEY"
      },
      "alwaysAllow": ["ping_porkbun", "list_domains", "get_dns_records"],
      "disabled": false
    }
  }
}
```

**Note:** Use `alwaysAllow` to auto-approve specific tools. Start with read-only tools for safety.

### Roo Code Configuration

Add to global settings or `.roo/mcp.json` (project):

```json
{
  "mcpServers": {
    "porkbun-server": {
      "command": "node",
      "args": [
        "/path/to/porkbun-mcp-server/build/index.js"
      ],
      "type": "stdio",
      "env": {
        "PORKBUN_API_KEY": "YOUR_API_KEY",
        "PORKBUN_SECRET_API_KEY": "YOUR_SECRET_API_KEY"
      },
      "alwaysAllow": ["ping_porkbun"],
      "disabled": false
    }
  }
}
```

**Note:** Roo Code supports creating new MCP servers on request and offers three operation modes.

### Kiro Configuration

Add to `.kiro/settings/mcp.json` (workspace) or `~/.kiro/settings/mcp.json` (user):

```json
{
  "mcpServers": {
    "porkbun-server": {
      "command": "node",
      "args": [
        "/path/to/porkbun-mcp-server/build/index.js"
      ],
      "env": {
        "PORKBUN_API_KEY": "YOUR_API_KEY",
        "PORKBUN_SECRET_API_KEY": "YOUR_SECRET_API_KEY"
      },
      "disabled": false,
      "autoApprove": ["ping_porkbun", "list_domains"]
    }
  }
}
```

**Note:** Use `autoApprove` for trusted tools. Set `chmod 600` on config files for security.

## Alternative: Using .env Files

Instead of putting API keys directly in configuration files, you can use a `.env` file:

1. **Create `.env` file** in a secure location (e.g., `~/.config/porkbun-mcp/.env`):
   ```dotenv
   PORKBUN_API_KEY=YOUR_API_KEY_HERE
   PORKBUN_SECRET_API_KEY=YOUR_SECRET_API_KEY_HERE
   ```

2. **Update configuration** to use `--dotenv-path`:
   ```json
   {
     "mcpServers": {
       "porkbun-server": {
         "command": "node",
         "args": [
           "/path/to/porkbun-mcp-server/build/index.js",
           "--dotenv-path",
           "/path/to/.env"
         ]
       }
     }
   }
   ```

**Security Best Practices:**
- Never commit `.env` files to version control
- Set restrictive permissions: `chmod 600 ~/.config/porkbun-mcp/.env`
- Store `.env` files outside project directories
- Use separate API keys with minimal permissions for MCP

### Claude Code Specific Configuration

Claude Code provides a powerful CLI interface for MCP server management with three configuration scopes:

- **Local scope** (default): Project-specific user settings (not shared)
- **Project scope**: Stored in `.mcp.json` (shared via version control)  
- **User scope**: Global configuration across all projects

#### Option 1: CLI Method (Recommended)

1. **Local Scope** (default - private to current project):
   ```bash
   # With environment variables
   claude mcp add porkbun-server node /path/to/porkbun-mcp-server/build/index.js
   
   # With .env file
   claude mcp add porkbun-server node /path/to/porkbun-mcp-server/build/index.js --dotenv-path /path/to/.env
   ```

2. **User Scope** (available across all projects):
   ```bash
   # With environment variables
   claude mcp add porkbun-server -s user node /path/to/porkbun-mcp-server/build/index.js
   
   # With .env file
   claude mcp add porkbun-server -s user node /path/to/porkbun-mcp-server/build/index.js --dotenv-path /path/to/.env
   ```

3. **Project Scope** (shared with team via `.mcp.json` in project root):
   ```bash
   # With environment variables
   claude mcp add porkbun-server -s project node /path/to/porkbun-mcp-server/build/index.js
   
   # With .env file
   claude mcp add porkbun-server -s project node /path/to/porkbun-mcp-server/build/index.js --dotenv-path /path/to/.env
   ```

**Important:** Make sure to set the `PORKBUN_API_KEY` and `PORKBUN_SECRET_API_KEY` environment variables in your shell before running Claude Code, or use the `--dotenv-path` option.

#### Option 2: Manual JSON Configuration

Create or edit `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "porkbun-server": {
      "command": "node",
      "args": [
        "/path/to/porkbun-mcp-server/build/index.js"
        // Add "--dotenv-path", "/path/to/.env" if using .env file
      ],
      "env": {
        // Optional: Set API keys directly here (not recommended for shared projects)
        // "PORKBUN_API_KEY": "YOUR_API_KEY",
        // "PORKBUN_SECRET_API_KEY": "YOUR_SECRET_API_KEY"
      }
    }
  }
}
```

#### Managing Claude Code MCP Servers

- **List installed servers:** `claude mcp list`
- **Get server details:** `claude mcp get porkbun-server`
- **Remove a server:** `claude mcp remove porkbun-server`
- **Import from Claude Desktop:** `claude mcp add-from-claude-desktop`
- **Add from JSON:** `claude mcp add-json`
- **Reset project choices:** `claude mcp reset-project-choices`

**Environment Variable Support:**
- Direct substitution: `${VAR}`
- With default fallback: `${VAR:-default_value}`
- Can be set via system environment, `-e` flag, or in `.mcp.json`

### Kiro Specific Configuration

Kiro supports MCP servers through JSON configuration files with workspace and user-level settings.

#### Prerequisites

1. Ensure you have the latest version of Kiro installed
2. Enable MCP support:
   - Click the Kiro Ghost icon in the activity bar
   - Enable MCPs in the panel
   - Click the edit button (pencil icon) next to MCP

#### Configuration Steps

1. **Open the MCP configuration file:**
   - **Via Command Palette:** Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
     - Select "MCP: Open User Configuration" for global settings
     - Or edit `.kiro/settings/mcp.json` directly for workspace settings
   - **Via Kiro Panel:** Click the edit button next to MCP in the Kiro panel

2. **Add the Porkbun server configuration:**
   
   For workspace-level configuration (`.kiro/settings/mcp.json`):
   ```json
   {
     "mcpServers": {
       "porkbun-server": {
         "command": "node",
         "args": [
           "/path/to/porkbun-mcp-server/build/index.js"
         ],
         "env": {
           "PORKBUN_API_KEY": "YOUR_API_KEY_HERE",
           "PORKBUN_SECRET_API_KEY": "YOUR_SECRET_API_KEY_HERE"
         },
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

   **Alternative with .env file:**
   ```json
   {
     "mcpServers": {
       "porkbun-server": {
         "command": "node",
         "args": [
           "/path/to/porkbun-mcp-server/build/index.js",
           "--dotenv-path",
           "/path/to/your/.env"
         ],
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

3. **Save the configuration file** and Kiro will automatically load the MCP server

#### Kiro MCP Troubleshooting

- View server status in the MCP servers tab
- Test tools by clicking them in the interface
- Reference tools in prompts with `#tool_name`
- Check logs in the Output panel
- Ensure JSON syntax is valid
- Use absolute paths only
- Set file permissions: `chmod 600` on config files for security
- Never commit mcp.json files containing sensitive tokens

### Windsurf Specific Configuration

Windsurf supports MCP servers through its Cascade AI assistant. Follow these steps:

#### Prerequisites

1. Ensure you have the latest version of Windsurf installed
2. Enable MCP support in Windsurf:
   - Launch Windsurf and click the "Windsurf - Settings" button (bottom right)
   - Or use Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows/Linux) and type "Open Windsurf Settings"
   - Scroll to the "Cascade" section in Advanced Settings
   - Find the Model Context Protocol (MCP) option and enable it
   - Restart Windsurf if prompted

#### Configuration File Location

The MCP configuration file for Windsurf is located at:
- **All platforms:** `~/.codeium/windsurf/mcp_config.json`

#### Configuration Steps

1. **Create or edit the MCP configuration file:**
   
   **Option 1: Using the UI**
   - In the Cascade > MCP Servers panel, click on "Add Custom Server +"
   - Or click on the Hammer Icon on the Cascade Tool bar, then click "Configure"

   **Option 2: Manual configuration**
   - Create/edit the file at `~/.codeium/windsurf/mcp_config.json`

2. **Add the Porkbun server configuration:**
   
   **With environment variables:**
   ```json
   {
     "mcpServers": {
       "porkbun-server": {
         "command": "node",
         "args": [
           "/path/to/porkbun-mcp-server/build/index.js"
         ]
       }
     }
   }
   ```

   **With .env file:**
   ```json
   {
     "mcpServers": {
       "porkbun-server": {
         "command": "node",
         "args": [
           "/path/to/porkbun-mcp-server/build/index.js",
           "--dotenv-path",
           "/path/to/your/.env"
         ]
       }
     }
   }
   ```

   **With API keys in configuration (not recommended for security):**
   ```json
   {
     "mcpServers": {
       "porkbun-server": {
         "command": "node",
         "args": [
           "/path/to/porkbun-mcp-server/build/index.js"
         ],
         "env": {
           "PORKBUN_API_KEY": "YOUR_API_KEY_HERE",
           "PORKBUN_SECRET_API_KEY": "YOUR_SECRET_API_KEY_HERE"
         }
       }
     }
   }
   ```

3. **Save the configuration file** and restart Windsurf

#### Windsurf MCP Features

- Windsurf's Cascade AI assistant can interact with multiple MCP servers simultaneously
- Supports both stdio and SSE (Server-Sent Events) communication protocols
- Pre-populated server templates available for popular services
- Windsurf limits how many tools within servers can be active at any moment

#### Windsurf MCP Troubleshooting

- If the server doesn't appear, click the refresh button in the top right corner of the MCP server section
- Check logs at `~/.codeium/windsurf/logs` for debugging information
- Ensure all paths use forward slashes (`/`), even on Windows
- Verify the Node.js executable is in your system PATH

#### Additional Resources

- Browse community MCP servers at:
  - https://opentools.com/
  - https://github.com/modelcontextprotocol/servers
  - https://windsurf.run/
- For more details, check the [Windsurf MCP Documentation](https://docs.windsurf.com/)

## Available Tools

**Domain Management:**
- `ping_porkbun` - Test API connection
- `list_domains` - List all domains (params: `start`, `includeLabels`)
- `check_domain` - Check availability (params: `domain`)
- `get_domain_pricing` - Get TLD pricing

**DNS Records:**
- `get_dns_records` - Get all/specific records (params: `domain`, `record_id`)
- `create_dns_record` - Add record (params: `domain`, `name`, `type`, `content`, `ttl`, `prio`)
- `edit_dns_record` - Edit by ID (params: `domain`, `record_id`, `type`, `content`, `ttl`, `prio`)
- `delete_dns_record` - Delete by ID (params: `domain`, `record_id`)
- `edit_dns_record_by_name_type` - Edit all matching records
- `delete_dns_record_by_name_type` - Delete all matching records
- `retrieve_dns_record_by_name_type` - Get matching records

**Other Services:**
- `get_ssl_bundle` - Get SSL certificates (params: `domain`)
- `get_nameservers` / `update_nameservers` - Manage nameservers
- `add_url_forward` / `get_url_forwarding` / `delete_url_forward` - URL forwarding
- `create_dnssec_record` / `get_dnssec_records` / `delete_dnssec_record` - DNSSEC management

**Common Parameters:**
- `domain`: Always required
- `name`: Subdomain (blank for root, `*` for wildcard)
- `type`: DNS record type (A, CNAME, MX, TXT, etc.)
- `content`: Record value/answer
- `ttl`: Time to live (default: 600)
- `prio`: Priority (for MX/SRV)

## Verify Installation

To verify the installation is working:

1.  **Restart/Reload your LLM application:**
    - **Claude Desktop:** Restart the app after editing config
    - **Claude Code:** Servers start automatically after `claude mcp add`
    - **Cursor:** Servers reload on config save
    - **Cline:** Auto-installs after saving settings
    - **Roo Code:** Auto-restarts on config changes
    - **Kiro:** Loads automatically on save

2.  **Test the connection:**
    ```
    Please test the Porkbun API connection using the ping_porkbun tool.
    ```
    You should see a success message with your IP address if configured correctly.

3.  **Client-specific verification:**
    - **Claude Code:** Run `claude mcp list` to see active servers
    - **Cursor:** Check Command Palette → "cursor settings" → MCP section
    - **Cline/Roo Code:** Check server status in MCP UI panel
    - **Kiro:** View MCP servers tab for connection status

## Usage Examples

Here are some examples of how to use the Porkbun MCP server with AI assistants:

### List Domains

```
List all domains in my Porkbun account.
```

### Get DNS Records

```
Show me all DNS records for example.com.
```

### Create a DNS Record

```
Create an A record for www.example.com pointing to 192.0.2.5 using the Porkbun server.
```

### Check Domain Availability

```
Check if my-new-idea.net is available using Porkbun.
```

## Troubleshooting

### Common Issues and Solutions

1.  **MCP server connection issues:**
    *   Verify absolute paths in configuration (no relative paths)
    *   Ensure server was built: `bun run build`
    *   Check Node.js installation: `node --version`
    *   Verify server name uniqueness
    *   **Client-specific checks:**
        - Claude Desktop: Must restart app after config changes
        - Cursor: Check if MCP is enabled in settings
        - Cline/Roo Code: Look for errors in MCP UI panel
        - Kiro: Check MCP servers tab for connection status

2.  **Authentication Errors:**
    *   Verify API keys are correct and enabled in Porkbun account
    *   **Environment variable issues by client:**
        - Claude Desktop: Must be in `"env"` section of config
        - Claude Code: Use `-e` flag or system environment
        - Cursor/Cline/Roo/Kiro: Set in `"env"` section
    *   If using `.env` file:
        - Verify file exists at specified path
        - Check file permissions (readable by your user)
        - Ensure correct format: `KEY=value` (no quotes needed)

3.  **Tool Execution Errors:**
    *   Check error message for specific details
    *   Verify required parameters are provided
    *   Ensure domain exists in your Porkbun account
    *   Check API rate limits

4.  **Configuration Issues:**
    *   **JSON syntax errors:**
        - Use a JSON validator
        - Common issues: trailing commas, unmatched brackets
        - Windows paths: escape backslashes or use forward slashes
    *   **Client-specific formats:**
        - Claude Code: Supports SSE/HTTP transport types
        - Cursor: Requires `"mcpServers"` wrapper
        - Cline/Roo: Supports `alwaysAllow` for auto-approval
        - Kiro: Supports `autoApprove` array

5.  **Platform-specific issues:**
    *   **Windows:**
        - Use `cmd` as command with `/c` flag for npx
        - Example: `"command": "cmd", "args": ["/c", "node", "path/to/server"]`
    *   **Permission errors:**
        - Ensure read/write access to config directories
        - MCP servers run with your user permissions

## Quick Reference

### File Locations by Client

| Client | Configuration File | Platform |
|--------|-------------------|----------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | macOS |
| Claude Desktop | `%APPDATA%\Claude\claude_desktop_config.json` | Windows |
| Claude Code | `.mcp.json` (project) or via `claude mcp add` | All |
| Cursor | `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global) | All |
| Cline | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` | macOS/Linux |
| Cline | `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` | Windows |
| Roo Code | Same as Cline but `rooveterinaryinc.roo-cline` or `.roo/mcp.json` | All |
| Kiro | `.kiro/settings/mcp.json` (workspace) or `~/.kiro/settings/mcp.json` (user) | All |

### Key Features by Client

| Feature | Claude Desktop | Claude Code | Cursor | Cline | Roo Code | Kiro |
|---------|---------------|-------------|---------|--------|-----------|-------|
| STDIO Support | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SSE/HTTP Support | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Auto-approve Tools | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| CLI Management | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Project Config | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Environment Variables | Config only | Flexible | Config | Config | Config | Config |


## Official MCP Documentation Links

**⚠️ IMPORTANT: IF YOU ARE HAVING TROUBLE WITH INSTALLATION, PLEASE REFER TO THE OFFICIAL DOCUMENTATION BELOW FOR YOUR SPECIFIC CLIENT ⚠️**

Each client has its own unique MCP implementation. The official documentation contains the most up-to-date installation instructions, troubleshooting guides, and configuration details specific to your client.

**Claude Desktop**
- MCP Docs: https://modelcontextprotocol.io/quickstart/user

**Claude Code**
- MCP Docs: https://docs.anthropic.com/en/docs/claude-code/mcp

**Cursor**
- MCP Docs: https://docs.cursor.com/context/mcp

**Cline**
- MCP Docs: https://docs.cline.bot/mcp/configuring-mcp-servers

**Roo Code**
- MCP Docs: https://docs.roocode.com/features/mcp/overview/
- MCP Configuration: https://docs.roocode.com/features/mcp/using-mcp-in-roo/

**Kiro**
- Main Docs: https://kiro.dev/docs/mcp/

**Windsurf**
- MCP Docs: https://docs.windsurf.com/windsurf/cascade/mcp

**General MCP Resources**
- MCP Protocol Documentation: https://modelcontextprotocol.io/
- Protocol specification: https://spec.modelcontextprotocol.io/
- GitHub organization: https://github.com/modelcontextprotocol
- Official servers: https://github.com/modelcontextprotocol/servers


**Porkbun API Documentation**
- API Docs: https://porkbun.com/api/json/v3/documentation