import { getPrivateConfig } from "./private-config";

type D1QueryResponse<Row> = {
  errors?: Array<{
    code?: number;
    message?: string;
  }>;
  result?: Array<{
    results?: Row[];
  }>;
  success?: boolean;
};

export async function d1Query<Row>(
  sql: string,
  params: Array<number | string | null> = []
) {
  const accountId = getPrivateConfig("CLOUDFLARE_ACCOUNT_ID");
  const databaseId = getPrivateConfig("CLOUDFLARE_D1_DATABASE_ID");
  const apiToken = getPrivateConfig("CLOUDFLARE_D1_API_TOKEN");

  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Missing D1 configuration");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql,
        params,
      }),
    }
  );

  const data = (await response.json().catch(() => null)) as
    | D1QueryResponse<Row>
    | null;

  if (!response.ok || !data || data.success === false) {
    const detail = data?.errors?.[0]?.message || "D1 query failed";
    throw new Error(detail);
  }

  return data;
}

export async function ensureD1Columns(table: string, columns: string[]) {
  for (const column of columns) {
    try {
      await d1Query(`ALTER TABLE ${table} ADD COLUMN ${column}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (!message.toLowerCase().includes("duplicate column")) {
        throw error;
      }
    }
  }
}
