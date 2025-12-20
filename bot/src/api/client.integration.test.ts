import http from 'http';
import assert from 'assert';
import ApiClient from './client';

function listenOnce(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void) {
  return new Promise<http.Server>((resolve, reject) => {
    const srv = http.createServer(handler);
    srv.listen(0, () => resolve(srv));
    srv.on('error', reject);
  });
}

async function testCaching() {
  let requests = 0;
  const srv = await listenOnce((req, res) => {
    if (req.url === '/guilds/g1/config' && req.method === 'GET') {
      requests++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ guildId: 'g1', prefix: '!' }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const { port } = srv.address() as any;
  const client = new ApiClient(`http://127.0.0.1:${port}`, { cacheTtlMs: 1000 });

  const a = await client.getGuildConfig('g1');
  assert.equal(a.guildId, 'g1');

  const b = await client.getGuildConfig('g1');
  assert.equal(b.guildId, 'g1');

  // because of cache, server should have been hit only once
  assert.equal(requests, 1, `expected 1 request, got ${requests}`);
  srv.close();
}

async function testRetries() {
  let calls = 0;
  const srv = await listenOnce((req, res) => {
    if (req.url === '/guilds/g2/config' && req.method === 'GET') {
      calls++;
      if (calls < 3) {
        res.writeHead(500);
        res.end('server error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ guildId: 'g2', prefix: '?' }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const { port } = srv.address() as any;
  const client = new ApiClient(`http://127.0.0.1:${port}`, { retries: 3, timeoutMs: 500 });

  const cfg = await client.getGuildConfig('g2');
  assert.equal(cfg.guildId, 'g2');
  // should have retried until success (3 calls)
  assert.equal(calls, 3, `expected 3 calls, got ${calls}`);
  srv.close();
}

async function run() {
  try {
    await testCaching();
    console.log('caching test passed');
    await testRetries();
    console.log('retries test passed');
    console.log('All integration tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Integration tests failed:', err);
    process.exit(1);
  }
}

run();
