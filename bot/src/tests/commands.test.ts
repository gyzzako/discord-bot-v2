import { handlePing } from '../commands/ping';

async function run() {
  if (typeof handlePing !== 'function') throw new Error('missing handlePing');
  console.log('commands smoke test OK');
}

run().catch((err) => { console.error(err); process.exit(1); });
