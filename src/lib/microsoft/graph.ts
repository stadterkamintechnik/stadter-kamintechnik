type GraphTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

let cachedToken: { value: string; expiresAt: number } | undefined;

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value || typeof value !== "string") {
    throw new Error(`Fehlende Umgebungsvariable: ${name}`);
  }
  return value;
}

export async function getMicrosoftGraphToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.value;

  const tenantId = requireEnv("MS_TENANT_ID");
  const clientId = requireEnv("MS_CLIENT_ID");
  const clientSecret = requireEnv("MS_CLIENT_SECRET");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body },
  );

  const data = (await response.json()) as GraphTokenResponse;
  if (!response.ok || !data.access_token) {
    const details = data.error_description || data.error || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Microsoft-Authentifizierung fehlgeschlagen: ${details}`);
  }

  cachedToken = { value: data.access_token, expiresAt: now + (data.expires_in ?? 3600) * 1000 };
  return data.access_token;
}

export function getRequiredEnv(name: string): string {
  return requireEnv(name);
}
