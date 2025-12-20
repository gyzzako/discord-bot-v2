import ApiClient from './client';

async function smokeTest() {
  const client = new ApiClient('http://localhost:8080', { timeoutMs: 100 });
  // Ensure methods exist and return Promises.
  if (typeof client.getGuildConfig !== 'function') throw new Error('missing getGuildConfig');
  if (typeof client.putGuildConfig !== 'function') throw new Error('missing putGuildConfig');

  console.log('ApiClient smoke test OK');
}

smokeTest().catch((err) => {
  console.error('smoke test failed:', err);
  process.exit(1);
});
