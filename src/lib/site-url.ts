import "server-only";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  const value = configuredUrl || vercelUrl || "http://localhost:3000";
  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;

  return withProtocol.replace(/\/$/, "");
}
