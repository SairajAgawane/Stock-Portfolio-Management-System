const baseUrl = process.env.API_URL ?? 'http://localhost:4000';

async function check(path: string, expected: number) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== expected) throw new Error(`${path}: expected ${expected}, received ${response.status}`);
  console.log(`PASS ${path} (${response.status})`);
}

await check('/api/health', 200);
await check('/api/portfolio', 401);
console.log('Smoke test complete.');
