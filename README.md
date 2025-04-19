# Porkbun MCP Server

[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue)](https://modelcontextprotocol.io)

A Model Context Protocol (MCP) server that provides tools to interact with the [Porkbun API (v3)](https://porkbun.com/api/json/v3/documentation).

This server allows MCP-compatible clients (like AI assistants, IDE extensions, etc.) to manage Porkbun domains, DNS records, SSL certificates, and more, through a standardized interface.

## Tools

1.  **`ping_porkbun`**
    *   Tests the Porkbun API connection and authentication.
    *   Inputs: None
    *   Returns: Success message including the client's public IP address, or an error message.

2.  **`list_domains`**
    *   Retrieves a list of domains in the Porkbun account.
    *   Inputs:
        *   `start` (optional number): Index to start retrieving domains from (default 0).
        *   `includeLabels` (optional enum: "yes"): Include domain labels.
    *   Returns: An array of domain objects with details like status, expiration date, etc.

3.  **`get_dns_records`**
    *   Retrieves all DNS records for a specified domain.
    *   Inputs:
        *   `domain` (string): The domain name.
    *   Returns: An array of DNS record objects.

4.  **`create_dns_record`**
    *   Adds a new DNS record to a specified domain.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `name` (optional string): Subdomain (leave blank for root, \* for wildcard).
        *   `type` (string): Record type (A, CNAME, MX, TXT, NS, AAAA, SRV, TLSA, CAA, HTTPS, SVCB).
        *   `content` (string): Record content/answer.
        *   `ttl` (optional number): Time To Live in seconds (default 600, min 600).
        *   `prio` (optional number): Priority (required for MX/SRV records).
    *   Returns: Success message with the new record ID.

5.  **`edit_dns_record`**
    *   Modifies an existing DNS record using its ID.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `record_id` (string): The ID of the record to edit.
        *   `name` (optional string): New subdomain.
        *   `type` (string): New record type (A, CNAME, MX, etc.).
        *   `content` (string): New record content/answer.
        *   `ttl` (optional number): New TTL in seconds (default 600, min 600).
        *   `prio` (optional number): New Priority (for MX/SRV records).
    *   Returns: Success message.

6.  **`delete_dns_record`**
    *   Removes a specific DNS record using its ID.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `record_id` (string): The ID of the record to delete.
    *   Returns: Success message.

7.  **`get_ssl_bundle`**
    *   Retrieves the SSL certificate bundle for a specified domain.
    *   Inputs:
        *   `domain` (string): The domain name.
    *   Returns: An object containing `certificatechain`, `privatekey`, and `publickey`.

8.  **`update_nameservers`**
    *   Updates the nameservers for a specified domain.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `ns` (array of strings): An array of name server hostnames.
    *   Returns: Success message.

9.  **`get_nameservers`**
    *   Gets the authoritative nameservers for a specified domain from the registry.
    *   Inputs:
        *   `domain` (string): The domain name.
    *   Returns: An array of name server hostnames.

10. **`add_url_forward`**
    *   Adds URL forwarding for a domain or subdomain.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `subdomain` (optional string): Subdomain to forward (leave blank for root).
        *   `location` (string): URL to forward to.
        *   `type` (enum: "temporary", "permanent"): Type of forward.
        *   `includePath` (optional enum: "yes", "no"): Include URI path in redirection (default "no").
        *   `wildcard` (optional enum: "yes", "no"): Also forward all subdomains (default "no").
    *   Returns: Success message.

11. **`get_url_forwarding`**
    *   Gets URL forwarding records for a domain.
    *   Inputs:
        *   `domain` (string): The domain name.
    *   Returns: An array of URL forward record objects.

12. **`delete_url_forward`**
    *   Deletes a URL forward record for a domain by its ID.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `forward_id` (string): The ID of the URL forward record to delete.
    *   Returns: Success message.

13. **`check_domain`**
    *   Checks the availability of a domain name.
    *   Inputs:
        *   `domain` (string): The domain name to check.
    *   Returns: An object detailing the domain's availability, pricing, and premium status.

14. **`edit_dns_record_by_name_type`**
    *   Edits all DNS records matching a domain, subdomain (optional), and type.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `type` (string): The type of records to edit.
        *   `name` (optional string): The subdomain to edit (leave blank for root, \* for wildcard).
        *   `content` (string): The new answer content for the matching records.
        *   `ttl` (optional number): The new TTL (default 600, min 600).
        *   `prio` (optional number): The new priority (for MX/SRV records).
    *   Returns: Success message.

15. **`delete_dns_record_by_name_type`**
    *   Deletes all DNS records matching a domain, subdomain (optional), and type.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `type` (string): The type of records to delete.
        *   `name` (optional string): The subdomain to delete (leave blank for root, \* for wildcard).
    *   Returns: Success message.

16. **`retrieve_dns_record_by_name_type`**
    *   Retrieves all DNS records matching a domain, subdomain (optional), and type.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `type` (string): The type of records to retrieve.
        *   `name` (optional string): The subdomain to retrieve (leave blank for root, \* for wildcard).
    *   Returns: An array of matching DNS record objects.

17. **`create_dnssec_record`**
    *   Creates a DNSSEC record at the registry for the domain.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `keyTag` (string): Key Tag.
        *   `alg` (string): DS Data Algorithm.
        *   `digestType` (string): Digest Type.
        *   `digest` (string): Digest.
        *   `maxSigLife` (optional string): Max Sig Life.
        *   `keyDataFlags` (optional string): Key Data Flags.
        *   `keyDataProtocol` (optional string): Key Data Protocol.
        *   `keyDataAlgo` (optional string): Key Data Algorithm.
        *   `keyDataPubKey` (optional string): Key Data Public Key.
    *   Returns: Success message.

18. **`get_dnssec_records`**
    *   Gets the DNSSEC records associated with the domain at the registry.
    *   Inputs:
        *   `domain` (string): The domain name.
    *   Returns: An object containing DNSSEC records, keyed by Key Tag.

19. **`delete_dnssec_record`**
    *   Deletes a DNSSEC record associated with the domain at the registry by Key Tag.
    *   Inputs:
        *   `domain` (string): The domain name.
        *   `keyTag` (string): The Key Tag of the DNSSEC record to delete.
    *   Returns: Success message.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   npm (usually included with Node.js)
*   Porkbun API Key and Secret Key ([generate here](https://porkbun.com/account/api))

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/miraclebakelaser/porkbun-mcp-server.git
    cd porkbun-mcp-server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure API Keys:**
    You can provide your Porkbun API Key and Secret Key in multiple ways (highest precedence first):
    *   **System Environment Variables:** Set `PORKBUN_API_KEY` and `PORKBUN_SECRET_API_KEY` in your system environment.
    *   **Custom `.env` File:** Create a `.env` file at a custom location and specify its path using the `--dotenv-path` (or `-p`) command-line argument when running the server (see Running the Server section).
    *   **Default `.env` File:** Create a file named `.env` in the project root directory (`porkbun-mcp-server/.env`) with the following content:
        ```dotenv
        PORKBUN_API_KEY=YOUR_API_KEY
        PORKBUN_SECRET_API_KEY=YOUR_SECRET_API_KEY
        ```
    Replace `YOUR_API_KEY` and `YOUR_SECRET_API_KEY` with your actual keys.
    **Important:** Add `.env` files to your `.gitignore` if you plan to commit this project to version control.

## Building

Compile the TypeScript code to JavaScript:

```bash
npm run build
```
This will create the executable JavaScript file in the `build/` directory.

## Running the Server

You can run the compiled server directly using Node.js.

**Standard Start:**
Uses the default `.env` location or system environment variables.
```bash
npm start
# or directly:
node build/index.js
```

**Start with Custom `.env` Path:**
Use the `--dotenv-path` or `-p` argument to specify the location of your `.env` file:
```bash
node build/index.js --dotenv-path /path/to/your/.env
# or shorthand:
node build/index.js -p /path/to/your/.env
```

**Development Mode:**
The `dev` script watches for changes and rebuilds/restarts automatically. To pass arguments like `--dotenv-path` to the underlying `node` command when using `npm run dev`, you typically need to use `--`:
```bash
# Development with default .env
npm run dev

# Development with custom .env path
npm run dev -- --dotenv-path /path/to/your/.env
# or
npm run dev -- -p /path/to/your/.env
```

The server communicates using the MCP `stdio` transport (standard input/output).

## Usage with Claude Desktop

To use this server with the Claude Desktop app, add the following configuration to the "mcpServers" section of your `claude_desktop_config.json`:

*   **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
*   **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
    (Create the file if it doesn't exist).

**Important:** Replace the placeholder paths below with the correct **absolute paths** on your specific system.

Make sure to use the **absolute path** to the `build/index.js` file in this project. You can also pass the `--dotenv-path` argument here if needed:

```json
{
  "mcpServers": {
    "porkbun": {
      "command": "node",
      "args": [
        "/absolute/path/to/your/porkbun-mcp-server/build/index.js",
        // Optional: Add custom .env path if needed
        // "--dotenv-path",
        // "/absolute/path/to/your/.env"
      ]
      // Optional: If keys aren't in the environment where Claude runs the server
      // (and not using .env or --dotenv-path), you can add them here:
      // "env": {
      //   "PORKBUN_API_KEY": "YOUR_API_KEY",
      //   "PORKBUN_SECRET_API_KEY": "YOUR_SECRET_API_KEY"
      // }
    }
    // Add other servers here if needed
  }
}
```

Remember to replace `/absolute/path/to/your/porkbun-mcp-server/build/index.js` (and the optional `.env` path if used) with the correct absolute paths on your system. Save the configuration file and **restart Claude Desktop**.

The Porkbun tools should now be available within Claude.

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the [LICENSE](./LICENSE) file in the project repository.
