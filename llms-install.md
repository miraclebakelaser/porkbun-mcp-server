# Porkbun MCP Server Installation Guide

This guide is specifically designed for AI agents like Cline to install and configure the Porkbun MCP server for use with LLM applications like Claude Desktop, Cursor, Roo Code, and Cline.

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
    Add the Porkbun MCP server configuration to your MCP settings file based on your LLM client:

    #### Configuration File Locations

    *   Cline (VS Code Extension): `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
    *   Roo Code (VS Code Extension): `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
    *   Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
    *   Cursor: `[project root]/.cursor/mcp.json`

    Add or merge this configuration into your chosen client's settings file. **Crucially, update the `"/path/to/porkbun-mcp-server"` placeholder to the actual absolute path where you cloned the repository.**

    ```json
    {
      "mcpServers": {
        "porkbun-server": {
          // --- Option 1: Using Environment Variables for API Keys ---
          "command": "node",
          "args": [
            "/path/to/porkbun-mcp-server/build/index.js" // <-- IMPORTANT: Update this path
          ],
          // --- Option 2: Using a .env file for API Keys ---
          // "command": "node",
          // "args": [
          //   "/path/to/porkbun-mcp-server/build/index.js", // <-- IMPORTANT: Update this path
          //   "--dotenv-path",
          //   "/path/to/your/.env" // <-- IMPORTANT: Update this path
          // ],
          // --- Common Settings ---
          "cwd": "/path/to/porkbun-mcp-server", // <-- IMPORTANT: Update this path
          "disabled": false,
          "autoApprove": [] // Add specific tool names here if you want to auto-approve them
        }
      }
    }
    ```
    *Choose either Option 1 or Option 2 for the `command` and `args` based on how you configured API keys.*
    *Make sure the `cwd` (Current Working Directory) also points to the correct absolute path of the project.*

## Available MCP Tools

Once configured, you'll have access to these Porkbun tools:

### 1. `ping_porkbun`
Tests the Porkbun API connection and authentication.
**Parameters:** None
**Example:**
```json
{}
```

### 2. `get_domain_pricing`
Retrieves the default domain pricing information for all supported TLDs. (Does not require authentication).
**Parameters:** None
**Example:**
```json
{}
```

### 3. `list_domains`
Retrieves a list of domains in the Porkbun account.
**Parameters:**
- `start`: (Optional, number) Index to start retrieving domains from (default 0).
- `includeLabels`: (Optional, enum: "yes") Include domain labels.
**Example:**
```json
{
  "start": 0,
  "includeLabels": "yes"
}
```

### 4. `get_dns_records`
Retrieves DNS records for a domain. If `record_id` is provided, retrieves a single record; otherwise, retrieves all records.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `record_id`: (Optional, string) The ID of a specific record to retrieve.
**Example (All Records):**
```json
{
  "domain": "example.com"
}
```
**Example (Single Record):**
```json
{
  "domain": "example.com",
  "record_id": "123456789"
}
```

### 5. `create_dns_record`
Adds a new DNS record to a specified domain.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `name`: (Optional, string) Subdomain (leave blank for root, `*` for wildcard).
- `type`: (Required, string) Record type (A, CNAME, MX, etc.).
- `content`: (Required, string) Record content/answer.
- `ttl`: (Optional, number, default: 600) Time To Live in seconds (min 600).
- `prio`: (Optional, number) Priority (for MX/SRV records).
**Example:**
```json
{
  "domain": "example.com",
  "name": "www",
  "type": "A",
  "content": "192.0.2.1",
  "ttl": 600
}
```

### 6. `edit_dns_record`
Modifies an existing DNS record using its ID.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `record_id`: (Required, string) The ID of the record to edit.
- `name`: (Optional, string) New subdomain.
- `type`: (Required, string) New record type.
- `content`: (Required, string) New record content.
- `ttl`: (Optional, number, default: 600) New TTL.
- `prio`: (Optional, number) New Priority.
**Example:**
```json
{
  "domain": "example.com",
  "record_id": "123456789",
  "type": "A",
  "content": "192.0.2.2",
  "ttl": 1200
}
```

### 7. `delete_dns_record`
Removes a specific DNS record using its ID.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `record_id`: (Required, string) The ID of the record to delete.
**Example:**
```json
{
  "domain": "example.com",
  "record_id": "123456789"
}
```

### 8. `get_ssl_bundle`
Retrieves the SSL certificate bundle (certificate chain, private key, public key) for a specified domain.
**Parameters:**
- `domain`: (Required, string) The domain name.
**Example:**
```json
{
  "domain": "example.com"
}
```

### 9. `update_nameservers`
Updates the nameservers for a specified domain.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `ns`: (Required, array of strings) An array of name servers.
**Example:**
```json
{
  "domain": "example.com",
  "ns": ["ns1.example-dns.com", "ns2.example-dns.com"]
}
```

### 10. `get_nameservers`
Gets the authoritative nameservers for a specified domain.
**Parameters:**
- `domain`: (Required, string) The domain name.
**Example:**
```json
{
  "domain": "example.com"
}
```

### 11. `add_url_forward`
Adds URL forwarding for a domain or subdomain.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `subdomain`: (Optional, string, default: "") Subdomain to forward (leave blank for root).
- `location`: (Required, string) URL to forward to.
- `type`: (Required, enum: "temporary", "permanent") Type of forward.
- `includePath`: (Optional, enum: "yes", "no", default: "no") Include URI path in redirection.
- `wildcard`: (Optional, enum: "yes", "no", default: "no") Also forward all subdomains.
**Example:**
```json
{
  "domain": "example.com",
  "subdomain": "blog",
  "location": "https://my-other-site.com/blog",
  "type": "permanent",
  "includePath": "yes"
}
```

### 12. `get_url_forwarding`
Gets URL forwarding records for a domain.
**Parameters:**
- `domain`: (Required, string) The domain name.
**Example:**
```json
{
  "domain": "example.com"
}
```

### 13. `delete_url_forward`
Deletes a URL forward record for a domain by its ID.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `forward_id`: (Required, string) The ID of the URL forward record to delete.
**Example:**
```json
{
  "domain": "example.com",
  "forward_id": "987654321"
}
```

### 14. `check_domain`
Checks the availability of a domain name.
**Parameters:**
- `domain`: (Required, string) The domain name to check.
**Example:**
```json
{
  "domain": "new-awesome-domain.com"
}
```

### 15. `edit_dns_record_by_name_type`
Edits all DNS records matching a domain, subdomain (optional), and type.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `type`: (Required, string) The type of records to edit (A, MX, etc.).
- `name`: (Optional, string) The subdomain to edit (blank for root, `*` for wildcard).
- `content`: (Required, string) The new answer content.
- `ttl`: (Optional, number, default: 600) New TTL.
- `prio`: (Optional, number) New Priority.
**Example:**
```json
{
  "domain": "example.com",
  "type": "MX",
  "name": "",
  "content": "mail.newprovider.com",
  "prio": 10
}
```

### 16. `delete_dns_record_by_name_type`
Deletes all DNS records matching a domain, subdomain (optional), and type.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `type`: (Required, string) The type of records to delete.
- `name`: (Optional, string) The subdomain to delete (blank for root, `*` for wildcard).
**Example:**
```json
{
  "domain": "example.com",
  "type": "TXT",
  "name": "_acme-challenge"
}
```

### 17. `retrieve_dns_record_by_name_type`
Retrieves all DNS records matching a domain, subdomain (optional), and type.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `type`: (Required, string) The type of records to retrieve.
- `name`: (Optional, string) The subdomain to retrieve (blank for root, `*` for wildcard).
**Example:**
```json
{
  "domain": "example.com",
  "type": "A",
  "name": "www"
}
```

### 18. `create_dnssec_record`
Creates a DNSSEC record at the registry for the domain.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `keyTag`: (Required, string) Key Tag.
- `alg`: (Required, string) DS Data Algorithm.
- `digestType`: (Required, string) Digest Type.
- `digest`: (Required, string) Digest.
- `maxSigLife`: (Optional, string) Max Sig Life.
- `keyDataFlags`: (Optional, string) Key Data Flags.
- `keyDataProtocol`: (Optional, string) Key Data Protocol.
- `keyDataAlgo`: (Optional, string) Key Data Algorithm.
- `keyDataPubKey`: (Optional, string) Key Data Public Key.
**Example:**
```json
{
  "domain": "example.com",
  "keyTag": "12345",
  "alg": "8",
  "digestType": "2",
  "digest": "E2D3C916F6DEEAC73294E8268FB5885044A833CFFA5769A47825E6C4D33C25"
}
```

### 19. `get_dnssec_records`
Gets the DNSSEC records associated with the domain at the registry.
**Parameters:**
- `domain`: (Required, string) The domain name.
**Example:**
```json
{
  "domain": "example.com"
}
```

### 20. `delete_dnssec_record`
Deletes a DNSSEC record associated with the domain at the registry by Key Tag.
**Parameters:**
- `domain`: (Required, string) The domain name.
- `keyTag`: (Required, string) The Key Tag of the DNSSEC record to delete.
**Example:**
```json
{
  "domain": "example.com",
  "keyTag": "12345"
}
```

## Verify Installation

To verify the installation is working:

1.  Restart your LLM application (Cline, Claude Desktop, etc.) after updating the MCP settings.
2.  Test the connection by asking the AI to use the `ping_porkbun` tool:
    ```
    Please test the Porkbun API connection using the ping_porkbun tool.
    ```
    You should see a success message with your IP address if the configuration and API keys are correct.

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
    *   Verify the `command`, `args`, and `cwd` paths in your MCP settings file are correct absolute paths.
    *   Ensure the server code was built successfully (`bun run build`).
    *   Check if Node.js is correctly installed and accessible.
    *   Confirm no other MCP servers are conflicting on the same name (`porkbun-server`).

2.  **Authentication Errors (e.g., in `ping_porkbun`):**
    *   Double-check that your `PORKBUN_API_KEY` and `PORKBUN_SECRET_API_KEY` are correct.
    *   If using environment variables, ensure they are set in the environment where the MCP server process is launched by your LLM client.
    *   If using a `.env` file, verify the path in the MCP `args` is correct and the file content is accurate.
    *   Ensure the API keys are enabled in your Porkbun account settings.

3.  **Tool Execution Errors:**
    *   Check the specific error message returned by the tool.
    *   Verify the parameters provided match the required schema (e.g., correct domain name, valid record ID).
    *   Ensure the action is permitted by Porkbun's API (e.g., trying to delete a non-existent record).

4.  **JSON parsing errors in configuration:**
    *   Make sure your MCP settings file is valid JSON.
    *   Ensure all paths use forward slashes (`/`), even on Windows.
    *   Check for missing commas, extra commas, or mismatched brackets.

## Additional Information

For more details on the specific API endpoints used by these tools, refer to the [Porkbun API Documentation](https://porkbun.com/api/json/v3/documentation).
