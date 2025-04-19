import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv"; // Use namespace import
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// --- Command Line Arguments ---
const argv = yargs(hideBin(process.argv))
  .option('dotenv-path', {
    alias: 'p',
    type: 'string',
    description: 'Path to a .env file containing API keys (PORKBUN_API_KEY, PORKBUN_SECRET_API_KEY)'
  })
  .help()
  .parseSync(); // Use parseSync for top-level await compatibility if needed, or handle promise

// --- Configure dotenv ---
// Load from custom path if provided, otherwise dotenv searches default locations (.env)
dotenv.config({ path: argv.dotenvPath });

// --- Constants ---
const PORKBUN_API_BASE = "https://api.porkbun.com/api/json/v3";
const USER_AGENT = "porkbun-mcp-server/1.0.0";

// --- Environment Variables (Now read AFTER dotenv.config) ---
const PORKBUN_API_KEY = process.env.PORKBUN_API_KEY;
const PORKBUN_SECRET_API_KEY = process.env.PORKBUN_SECRET_API_KEY;

if (!PORKBUN_API_KEY || !PORKBUN_SECRET_API_KEY) {
  console.error(
    "Error: PORKBUN_API_KEY and PORKBUN_SECRET_API_KEY environment variables are required.",
    "Provide them via system environment variables or a .env file (specify path with --dotenv-path)."
  );
  process.exit(1);
}

// --- Porkbun API Helper ---
interface PorkbunRequestArgs {
  [key: string]: unknown;
}

interface PorkbunResponse {
  status: "SUCCESS" | "ERROR";
  message?: string;
  [key: string]: unknown; // Allow other response fields
}

async function porkbunRequest(
  endpoint: string,
  args: PorkbunRequestArgs = {},
  authenticated: boolean = true, // Add authenticated flag, default to true
): Promise<PorkbunResponse> {
  const url = `${PORKBUN_API_BASE}/${endpoint}`;
  let bodyData: PorkbunRequestArgs = { ...args };

  // Only add API keys if authenticated is true
  if (authenticated) {
    bodyData = {
      apikey: PORKBUN_API_KEY,
      secretapikey: PORKBUN_SECRET_API_KEY,
      ...bodyData,
    };
  }

  const body = JSON.stringify(bodyData);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: body,
    });

    if (!response.ok) {
      // Handle non-2xx HTTP errors
      const errorText = await response.text();
      console.error(`Porkbun API Error (${response.status}): ${errorText}`);
      return {
        status: "ERROR",
        message: `Porkbun API request failed with status ${response.status}: ${errorText}`,
      };
    }

    const jsonResponse = (await response.json()) as PorkbunResponse;
    return jsonResponse;
  } catch (error) {
    console.error("Error making Porkbun API request:", error);
    return {
      status: "ERROR",
      message: `Network or fetch error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// --- MCP Server Setup ---
const server = new McpServer({
  name: "porkbun-server",
  version: "1.0.0",
  capabilities: {
    tools: {}, // Enable tools capability
  },
});

// --- Tool Definitions ---

// 1. ping_porkbun
server.tool(
  "ping_porkbun",
  "Tests the Porkbun API connection and authentication.",
  {}, // No input arguments - Pass an empty object for the shape
  async (): Promise<CallToolResult> => {
    const response = await porkbunRequest("ping");

    if (response.status === "SUCCESS") {
      return {
        content: [
          {
            type: "text",
            text: `Successfully pinged Porkbun API. Your IP: ${response.yourIp}`,
          },
        ],
      };
    } else {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error pinging Porkbun API: ${response.message || "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// NEW TOOL: get_domain_pricing
server.tool(
  "get_domain_pricing",
  "Retrieves the default domain pricing information for all supported TLDs.",
  {}, // No input arguments
  async (): Promise<CallToolResult> => {
    // Call the helper with authenticated set to false
    const response = await porkbunRequest("pricing/get", {}, false); 

    if (response.status === "SUCCESS" && response.pricing) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.pricing, null, 2),
          },
        ],
      };
    } else {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error retrieving domain pricing: ${response.message || "Unknown error"}`,
          },
        ],
      };
    }
  }
);


// 2. list_domains (Renumbered to 3)
const ListDomainsInputSchema = z.object({
  start: z.number().int().min(0).optional().describe("Index to start retrieving domains from (default 0)."),
  includeLabels: z.enum(["yes"]).optional().describe("Include domain labels (optional)."),
});

server.tool(
  "list_domains",
  "Retrieves a list of domains in the Porkbun account.",
  // Pass the shape directly, not the ZodObject instance
  {
    start: z.number().int().min(0).optional().describe("Index to start retrieving domains from (default 0)."),
    includeLabels: z.enum(["yes"]).optional().describe("Include domain labels (optional)."),
  },
  async (args): Promise<CallToolResult> => {
    // Validate args using the schema *inside* the handler
    const validationResult = ListDomainsInputSchema.safeParse(args);
    if (!validationResult.success) {
        return {
            isError: true,
            content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
        };
    }
    const validatedArgs = validationResult.data;

    const response = await porkbunRequest("domain/listAll", validatedArgs);

    if (response.status === "SUCCESS" && response.domains) {
      return {
        content: [
          {
            type: "text",
            // Convert domains array to JSON string for output
            text: JSON.stringify(response.domains, null, 2), 
          },
        ],
      };
    } else {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error listing domains: ${response.message || "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// 3. get_dns_records (Now handles retrieve all OR by ID)
const GetDnsRecordsInputSchema = z.object({
  domain: z.string().describe("The domain name."),
  record_id: z.string().optional().describe("Optional: The ID of a specific record to retrieve."),
});

server.tool(
  "get_dns_records",
  "Retrieves DNS records for a domain. If record_id is provided, retrieves a single record; otherwise, retrieves all records.",
  {
    domain: z.string().describe("The domain name."),
    record_id: z.string().optional().describe("Optional: The ID of a specific record to retrieve."),
  },
  async (args): Promise<CallToolResult> => {
    const validationResult = GetDnsRecordsInputSchema.safeParse(args);
    if (!validationResult.success) {
      return {
        isError: true,
        content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
      };
    }
    const { domain, record_id } = validationResult.data;

    // Construct endpoint based on whether record_id is provided
    const endpoint = record_id ? `dns/retrieve/${domain}/${record_id}` : `dns/retrieve/${domain}`;
    const actionDescription = record_id ? `record ID ${record_id}` : `all records`;

    const response = await porkbunRequest(endpoint);

    if (response.status === "SUCCESS" && response.records) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.records, null, 2),
          },
        ],
      };
    } else {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error retrieving DNS ${actionDescription} for ${domain}: ${response.message || "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// 4. create_dns_record (Renumbered)
const CreateDnsRecordInputSchema = z.object({
  domain: z.string().describe("The domain name."),
  name: z.string().optional().describe("Subdomain (leave blank for root, * for wildcard)."),
  type: z.string().describe("Record type (A, CNAME, MX, etc.)."),
  content: z.string().describe("Record content/answer."),
  ttl: z.number().int().min(600).optional().default(600).describe("Time To Live in seconds (default 600)."),
  prio: z.number().int().optional().describe("Priority (for MX/SRV records)."),
});

server.tool(
  "create_dns_record",
  "Adds a new DNS record to a specified domain.",
  {
    domain: z.string().describe("The domain name."),
    name: z.string().optional().describe("Subdomain (leave blank for root, * for wildcard)."),
    type: z.string().describe("Record type. Valid types are: A, MX, CNAME, ALIAS, TXT, NS, AAAA, SRV, TLSA, CAA, HTTPS, SVCB."),
    content: z.string().describe("Record content/answer."),
    ttl: z.number().int().min(600).optional().default(600).describe("Time To Live in seconds (default 600)."),
    prio: z.number().int().optional().describe("Priority (for MX/SRV records)."),
  },
  async (args): Promise<CallToolResult> => {
    const validationResult = CreateDnsRecordInputSchema.safeParse(args);
    if (!validationResult.success) {
      return {
        isError: true,
        content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
      };
    }
    const { domain, ...recordArgs } = validationResult.data; // Separate domain for the endpoint

    const response = await porkbunRequest(`dns/create/${domain}`, recordArgs);

    if (response.status === "SUCCESS" && response.id) {
      return {
        content: [
          {
            type: "text",
            text: `Successfully created DNS record with ID: ${response.id}`,
          },
        ],
      };
    } else {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error creating DNS record for ${domain}: ${response.message || "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// 5. edit_dns_record
const EditDnsRecordInputSchema = z.object({
    domain: z.string().describe("The domain name."),
    record_id: z.string().describe("The ID of the record to edit."),
    name: z.string().optional().describe("New subdomain (optional)."),
    type: z.string().describe("New record type (A, CNAME, etc.)."),
    content: z.string().describe("New record content/answer."),
    ttl: z.number().int().min(600).optional().default(600).describe("New TTL in seconds (optional)."),
    prio: z.number().int().optional().describe("New Priority (for MX/SRV, optional)."),
});

server.tool(
    "edit_dns_record",
    "Modifies an existing DNS record using its ID.",
    {
        domain: z.string().describe("The domain name."),
        record_id: z.string().describe("The ID of the record to edit."),
        name: z.string().optional().describe("New subdomain (optional)."),
        type: z.string().describe("New record type. Valid types are: A, MX, CNAME, ALIAS, TXT, NS, AAAA, SRV, TLSA, CAA, HTTPS, SVCB."),
        content: z.string().describe("New record content/answer."),
        ttl: z.number().int().min(600).optional().default(600).describe("New TTL in seconds (optional)."),
        prio: z.number().int().optional().describe("New Priority (for MX/SRV, optional)."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = EditDnsRecordInputSchema.safeParse(args);
        if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        // Separate domain and record_id for the endpoint, rest are body args
        const { domain, record_id, ...recordArgs } = validationResult.data; 

        const response = await porkbunRequest(`dns/edit/${domain}/${record_id}`, recordArgs);

        if (response.status === "SUCCESS") {
            return {
                content: [
                    {
                        type: "text",
                        text: `Successfully edited DNS record ID: ${record_id} for domain ${domain}.`,
                    },
                ],
            };
        } else {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error editing DNS record ID ${record_id} for ${domain}: ${response.message || "Unknown error"}`,
                    },
                ],
            };
        }
    },
);

// 6. delete_dns_record
const DeleteDnsRecordInputSchema = z.object({
  domain: z.string().describe("The domain name."),
  record_id: z.string().describe("The ID of the record to delete."),
});

server.tool(
  "delete_dns_record",
  "Removes a specific DNS record using its ID.",
  {
    domain: z.string().describe("The domain name."),
    record_id: z.string().describe("The ID of the record to delete."),
  },
  async (args): Promise<CallToolResult> => {
    const validationResult = DeleteDnsRecordInputSchema.safeParse(args);
    if (!validationResult.success) {
      return {
        isError: true,
        content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
      };
    }
    const { domain, record_id } = validationResult.data; // domain and record_id are part of the endpoint

    // No body arguments needed for delete
    const response = await porkbunRequest(`dns/delete/${domain}/${record_id}`);

    if (response.status === "SUCCESS") {
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted DNS record ID: ${record_id} for domain ${domain}.`,
          },
        ],
      };
    } else {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error deleting DNS record ID ${record_id} for ${domain}: ${response.message || "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// 7. get_ssl_bundle
const GetSslBundleInputSchema = z.object({
  domain: z.string().describe("The domain name."),
});

server.tool(
  "get_ssl_bundle",
  "Retrieves the SSL certificate bundle for a specified domain.",
  {
    domain: z.string().describe("The domain name."),
  },
  async (args): Promise<CallToolResult> => {
    const validationResult = GetSslBundleInputSchema.safeParse(args);
    if (!validationResult.success) {
      return {
        isError: true,
        content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
      };
    }
    const { domain } = validationResult.data; // domain is part of the endpoint

    // No body arguments needed for retrieve
    const response = await porkbunRequest(`ssl/retrieve/${domain}`);

    if (response.status === "SUCCESS") {
      // Return the bundle components as separate text outputs or a single JSON
      // Returning as JSON string for easy parsing by the client/LLM
      const bundle = {
          certificatechain: response.certificatechain,
          privatekey: response.privatekey,
          publickey: response.publickey,
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(bundle, null, 2),
          },
        ],
      };
    } else {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error retrieving SSL bundle for ${domain}: ${response.message || "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// --- Domain Tools ---

// 8. update_nameservers
const UpdateNameserversInputSchema = z.object({
    domain: z.string().describe("The domain name."),
    ns: z.array(z.string()).min(1).describe("An array of name servers."),
});

server.tool(
    "update_nameservers",
    "Updates the nameservers for a specified domain.",
    {
        domain: z.string().describe("The domain name."),
        ns: z.array(z.string()).min(1).describe("An array of name servers."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = UpdateNameserversInputSchema.safeParse(args);
        if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain, ns } = validationResult.data;
        const response = await porkbunRequest(`domain/updateNs/${domain}`, { ns });

        if (response.status === "SUCCESS") {
            return { content: [{ type: "text", text: `Successfully updated nameservers for ${domain}.` }] };
        } else {
            return {
                isError: true,
                content: [{ type: "text", text: `Error updating nameservers for ${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// 9. get_nameservers
const GetNameserversInputSchema = z.object({
    domain: z.string().describe("The domain name."),
});

server.tool(
    "get_nameservers",
    "Gets the authoritative nameservers for a specified domain.",
    {
        domain: z.string().describe("The domain name."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = GetNameserversInputSchema.safeParse(args);
        if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain } = validationResult.data;
        const response = await porkbunRequest(`domain/getNs/${domain}`);

        if (response.status === "SUCCESS" && response.ns) {
            return { content: [{ type: "text", text: JSON.stringify(response.ns, null, 2) }] };
        } else {
            return {
                isError: true,
                content: [{ type: "text", text: `Error getting nameservers for ${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// 10. add_url_forward
const AddUrlForwardInputSchema = z.object({
    domain: z.string().describe("The domain name."),
    subdomain: z.string().optional().default("").describe("Subdomain to forward (leave blank for root)."),
    location: z.string().url().describe("URL to forward to."),
    type: z.enum(["temporary", "permanent"]).describe("Type of forward (temporary or permanent)."),
    includePath: z.enum(["yes", "no"]).optional().default("no").describe("Include URI path in redirection (yes/no)."),
    wildcard: z.enum(["yes", "no"]).optional().default("no").describe("Also forward all subdomains (yes/no)."),
});

server.tool(
    "add_url_forward",
    "Adds URL forwarding for a domain or subdomain.",
     {
        domain: z.string().describe("The domain name."),
        subdomain: z.string().optional().default("").describe("Subdomain to forward (leave blank for root)."),
        location: z.string().url().describe("URL to forward to."),
        type: z.enum(["temporary", "permanent"]).describe("Type of forward (temporary or permanent)."),
        includePath: z.enum(["yes", "no"]).optional().default("no").describe("Include URI path in redirection (yes/no)."),
        wildcard: z.enum(["yes", "no"]).optional().default("no").describe("Also forward all subdomains (yes/no)."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = AddUrlForwardInputSchema.safeParse(args);
        if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain, ...forwardArgs } = validationResult.data;
        const response = await porkbunRequest(`domain/addUrlForward/${domain}`, forwardArgs);

        if (response.status === "SUCCESS") {
            return { content: [{ type: "text", text: `Successfully added URL forward for ${forwardArgs.subdomain || '@'}.${domain}.` }] };
        } else {
            return {
                isError: true,
                content: [{ type: "text", text: `Error adding URL forward for ${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// 11. get_url_forwarding
const GetUrlForwardingInputSchema = z.object({
    domain: z.string().describe("The domain name."),
});

server.tool(
    "get_url_forwarding",
    "Gets URL forwarding records for a domain.",
    {
        domain: z.string().describe("The domain name."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = GetUrlForwardingInputSchema.safeParse(args);
        if (!validationResult.success) {
             return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain } = validationResult.data;
        const response = await porkbunRequest(`domain/getUrlForwarding/${domain}`);

        if (response.status === "SUCCESS" && response.forwards) {
             return { content: [{ type: "text", text: JSON.stringify(response.forwards, null, 2) }] };
        } else {
             return {
                isError: true,
                content: [{ type: "text", text: `Error getting URL forwards for ${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// 12. delete_url_forward
const DeleteUrlForwardInputSchema = z.object({
    domain: z.string().describe("The domain name."),
    forward_id: z.string().describe("The ID of the URL forward record to delete."),
});

server.tool(
    "delete_url_forward",
    "Deletes a URL forward record for a domain by its ID.",
    {
        domain: z.string().describe("The domain name."),
        forward_id: z.string().describe("The ID of the URL forward record to delete."),
    },
     async (args): Promise<CallToolResult> => {
        const validationResult = DeleteUrlForwardInputSchema.safeParse(args);
        if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain, forward_id } = validationResult.data;
        const response = await porkbunRequest(`domain/deleteUrlForward/${domain}/${forward_id}`);

         if (response.status === "SUCCESS") {
            return { content: [{ type: "text", text: `Successfully deleted URL forward ID ${forward_id} for ${domain}.` }] };
        } else {
            return {
                isError: true,
                content: [{ type: "text", text: `Error deleting URL forward ID ${forward_id} for ${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// 13. check_domain
const CheckDomainInputSchema = z.object({
  domain: z.string().describe("The domain name to check availability for."),
});

server.tool(
  "check_domain",
  "Checks the availability of a domain name.",
  {
    domain: z.string().describe("The domain name to check availability for."),
  },
  async (args): Promise<CallToolResult> => {
    const validationResult = CheckDomainInputSchema.safeParse(args);
    if (!validationResult.success) {
      return {
        isError: true,
        content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
      };
    }
    const { domain } = validationResult.data;
    const response = await porkbunRequest(`domain/checkDomain/${domain}`);

    if (response.status === "SUCCESS" && response.response) {
      return { content: [{ type: "text", text: JSON.stringify(response.response, null, 2) }] };
    } else {
      return {
        isError: true,
        content: [{ type: "text", text: `Error checking domain ${domain}: ${response.message || "Unknown error"}` }],
      };
    }
  }
);

// --- More DNS Tools ---

// 14. edit_dns_record_by_name_type
const EditDnsRecordByNameTypeInputSchema = z.object({
    domain: z.string().describe("The domain name."),
    type: z.string().describe("The type of records to edit (A, MX, CNAME, etc.)."),
    name: z.string().optional().describe("The subdomain to edit (leave blank for root, * for wildcard)."),
    content: z.string().describe("The new answer content for the matching records."),
    ttl: z.number().int().min(600).optional().default(600).describe("The new time to live in seconds (default 600)."),
    prio: z.number().int().optional().describe("The new priority (for MX/SRV records)."),
});

server.tool(
    "edit_dns_record_by_name_type",
    "Edits all DNS records matching a domain, subdomain (optional), and type. Corresponds to endpoint: dns/editByNameType/DOMAIN/TYPE/[SUBDOMAIN]",
    {
        domain: z.string().describe("The domain name (part of the URL path)."),
        type: z.string().describe("The type of records to edit (part of the URL path). Valid types are: A, MX, CNAME, ALIAS, TXT, NS, AAAA, SRV, TLSA, CAA, HTTPS, SVCB."),
        name: z.string().optional().describe("The subdomain to edit (optional part of the URL path, leave blank for root, * for wildcard)."),
        content: z.string().describe("The new answer content for the matching records (request body)."),
        ttl: z.number().int().min(600).optional().default(600).describe("The new time to live in seconds (request body, default 600)."),
        prio: z.number().int().optional().describe("The new priority (request body, for MX/SRV records)."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = EditDnsRecordByNameTypeInputSchema.safeParse(args);
        if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain, type, name, ...recordArgs } = validationResult.data;
        const subdomainPart = name ? `/${name}` : ""; // Subdomain is optional in the endpoint path
        const endpoint = `dns/editByNameType/${domain}/${type}${subdomainPart}`;
        
        const response = await porkbunRequest(endpoint, recordArgs);

        if (response.status === "SUCCESS") {
            return { content: [{ type: "text", text: `Successfully edited ${type} records for ${name || '@'}.${domain}.` }] };
        } else {
            return {
                isError: true,
                content: [{ type: "text", text: `Error editing ${type} records for ${name || '@'}.${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// 15. delete_dns_record_by_name_type
const DeleteDnsRecordByNameTypeInputSchema = z.object({
    domain: z.string().describe("The domain name."),
    type: z.string().describe("The type of records to delete (A, MX, CNAME, etc.)."),
    name: z.string().optional().describe("The subdomain to delete (leave blank for root, * for wildcard)."),
});

server.tool(
    "delete_dns_record_by_name_type",
    "Deletes all DNS records matching a domain, subdomain (optional), and type. Corresponds to endpoint: dns/deleteByNameType/DOMAIN/TYPE/[SUBDOMAIN]",
    {
        domain: z.string().describe("The domain name (part of the URL path)."),
        type: z.string().describe("The type of records to delete (part of the URL path). Valid types are: A, MX, CNAME, ALIAS, TXT, NS, AAAA, SRV, TLSA, CAA, HTTPS, SVCB."),
        name: z.string().optional().describe("The subdomain to delete (optional part of the URL path, leave blank for root, * for wildcard)."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = DeleteDnsRecordByNameTypeInputSchema.safeParse(args);
        if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain, type, name } = validationResult.data;
        const subdomainPart = name ? `/${name}` : ""; // Subdomain is optional in the endpoint path
        const endpoint = `dns/deleteByNameType/${domain}/${type}${subdomainPart}`;

        const response = await porkbunRequest(endpoint); // No body args needed

        if (response.status === "SUCCESS") {
            return { content: [{ type: "text", text: `Successfully deleted ${type} records for ${name || '@'}.${domain}.` }] };
        } else {
            return {
                isError: true,
                content: [{ type: "text", text: `Error deleting ${type} records for ${name || '@'}.${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// 16. retrieve_dns_record_by_name_type
const RetrieveDnsRecordByNameTypeInputSchema = z.object({
    domain: z.string().describe("The domain name."),
    type: z.string().describe("The type of records to retrieve (A, MX, CNAME, etc.)."),
    name: z.string().optional().describe("The subdomain to retrieve (leave blank for root, * for wildcard)."),
});

server.tool(
    "retrieve_dns_record_by_name_type",
    "Retrieves all DNS records matching a domain, subdomain (optional), and type. Corresponds to endpoint: dns/retrieveByNameType/DOMAIN/TYPE/[SUBDOMAIN]",
    {
         domain: z.string().describe("The domain name (part of the URL path)."),
        type: z.string().describe("The type of records to retrieve (part of the URL path). Valid types are: A, MX, CNAME, ALIAS, TXT, NS, AAAA, SRV, TLSA, CAA, HTTPS, SVCB."),
        name: z.string().optional().describe("The subdomain to retrieve (optional part of the URL path, leave blank for root, * for wildcard)."),
    },
     async (args): Promise<CallToolResult> => {
        const validationResult = RetrieveDnsRecordByNameTypeInputSchema.safeParse(args);
         if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain, type, name } = validationResult.data;
        const subdomainPart = name ? `/${name}` : ""; // Subdomain is optional in the endpoint path
        const endpoint = `dns/retrieveByNameType/${domain}/${type}${subdomainPart}`;

        const response = await porkbunRequest(endpoint); // No body args needed

        if (response.status === "SUCCESS" && response.records) {
            return { content: [{ type: "text", text: JSON.stringify(response.records, null, 2) }] };
        } else {
             return {
                isError: true,
                content: [{ type: "text", text: `Error retrieving ${type} records for ${name || '@'}.${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// --- DNSSEC Tools ---

// 17. create_dnssec_record
// Note: Several fields are optional according to Porkbun docs. Making them optional here.
const CreateDnssecRecordInputSchema = z.object({
    domain: z.string().describe("The domain name."),
    keyTag: z.string().describe("Key Tag."),
    alg: z.string().describe("DS Data Algorithm."),
    digestType: z.string().describe("Digest Type."),
    digest: z.string().describe("Digest."),
    maxSigLife: z.string().optional().describe("Max Sig Life (optional)."),
    keyDataFlags: z.string().optional().describe("Key Data Flags (optional)."),
    keyDataProtocol: z.string().optional().describe("Key Data Protocol (optional)."),
    keyDataAlgo: z.string().optional().describe("Key Data Algorithm (optional)."),
    keyDataPubKey: z.string().optional().describe("Key Data Public Key (optional)."),
});

server.tool(
    "create_dnssec_record",
    "Creates a DNSSEC record at the registry for the domain.",
    {
        domain: z.string().describe("The domain name."),
        keyTag: z.string().describe("Key Tag."),
        alg: z.string().describe("DS Data Algorithm."),
        digestType: z.string().describe("Digest Type."),
        digest: z.string().describe("Digest."),
        maxSigLife: z.string().optional().describe("Max Sig Life (optional)."),
        keyDataFlags: z.string().optional().describe("Key Data Flags (optional)."),
        keyDataProtocol: z.string().optional().describe("Key Data Protocol (optional)."),
        keyDataAlgo: z.string().optional().describe("Key Data Algorithm (optional)."),
        keyDataPubKey: z.string().optional().describe("Key Data Public Key (optional)."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = CreateDnssecRecordInputSchema.safeParse(args);
        if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain, ...dnssecArgs } = validationResult.data;
        const endpoint = `dns/createDnssecRecord/${domain}`;

        const response = await porkbunRequest(endpoint, dnssecArgs);

        if (response.status === "SUCCESS") {
            return { content: [{ type: "text", text: `Successfully created DNSSEC record for ${domain}.` }] };
        } else {
            return {
                isError: true,
                content: [{ type: "text", text: `Error creating DNSSEC record for ${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// 18. get_dnssec_records
const GetDnssecRecordsInputSchema = z.object({
    domain: z.string().describe("The domain name."),
});

server.tool(
    "get_dnssec_records",
    "Gets the DNSSEC records associated with the domain at the registry.",
    {
        domain: z.string().describe("The domain name."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = GetDnssecRecordsInputSchema.safeParse(args);
         if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain } = validationResult.data;
        const endpoint = `dns/getDnssecRecords/${domain}`;

        const response = await porkbunRequest(endpoint);

        if (response.status === "SUCCESS" && response.records) {
             return { content: [{ type: "text", text: JSON.stringify(response.records, null, 2) }] };
        } else {
            return {
                isError: true,
                content: [{ type: "text", text: `Error getting DNSSEC records for ${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);

// 19. delete_dnssec_record
const DeleteDnssecRecordInputSchema = z.object({
    domain: z.string().describe("The domain name."),
    keyTag: z.string().describe("The Key Tag of the DNSSEC record to delete."),
});

server.tool(
    "delete_dnssec_record",
    "Deletes a DNSSEC record associated with the domain at the registry by Key Tag.",
     {
        domain: z.string().describe("The domain name."),
        keyTag: z.string().describe("The Key Tag of the DNSSEC record to delete."),
    },
    async (args): Promise<CallToolResult> => {
        const validationResult = DeleteDnssecRecordInputSchema.safeParse(args);
         if (!validationResult.success) {
            return {
                isError: true,
                content: [{ type: "text", text: `Invalid arguments: ${validationResult.error.message}` }],
            };
        }
        const { domain, keyTag } = validationResult.data;
        const endpoint = `dns/deleteDnssecRecord/${domain}/${keyTag}`;

        const response = await porkbunRequest(endpoint);

        if (response.status === "SUCCESS") {
             return { content: [{ type: "text", text: `Successfully deleted DNSSEC record with Key Tag ${keyTag} for ${domain}.` }] };
        } else {
             return {
                isError: true,
                content: [{ type: "text", text: `Error deleting DNSSEC record with Key Tag ${keyTag} for ${domain}: ${response.message || "Unknown error"}` }],
            };
        }
    }
);


// --- All tools implemented ---

// --- Start Server ---
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Porkbun MCP Server running on stdio");
  } catch (error) {
    console.error("Fatal error initializing Porkbun MCP Server:", error);
    process.exit(1);
  }
}

main();
