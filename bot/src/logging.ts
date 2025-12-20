const levels: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

const envLevel = process.env.LOG_LEVEL || (process.env.LOG_SILENT ? 'silent' : 'info');
const currentLevel = levels[envLevel] ?? levels.info;

function should(level: keyof typeof levels) {
  return levels[level] >= currentLevel;
}

export const logger = {
  debug: (...args: any[]) => { if (should('debug')) console.debug(...args); },
  info: (...args: any[]) => { if (should('info')) console.log(...args); },
  warn: (...args: any[]) => { if (should('warn')) console.warn(...args); },
  error: (...args: any[]) => { if (should('error')) console.error(...args); },
};

export default logger;
