require('dotenv').config()
import { initBot, shutdown } from './bot';

(async () => {
  console.log('Starting bot...');
  await initBot();

  const onExit = async () => {
    console.log('Shutting down...');
    await shutdown();
    process.exit(0);
  };

  process.once('SIGINT', onExit);
  process.once('SIGTERM', onExit);
})();
