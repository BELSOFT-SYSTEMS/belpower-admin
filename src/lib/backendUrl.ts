/** Root BelPower API host (no `/api/v1/...` suffix). */
export function getBackendBaseUrl(): string {
  const fromEnv = process.env.BACKEND_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const adminApi =
    process.env.ADMIN_API_URL?.replace(/\/$/, '') ?? 'https://api.belpower.ng/api/v1/admin';
  const derived = adminApi.replace(/\/api\/v1\/admin$/, '');
  return derived || 'https://api.belpower.ng';
}
