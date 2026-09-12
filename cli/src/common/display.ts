export const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export const log = (msg: string) => console.log(`  ${msg}`);
export const heading = (msg: string) => console.log(`\n${c.bold}${c.cyan}── ${msg} ${c.reset}`);
export const ok = (msg: string) => console.log(`  ${c.green}✓${c.reset} ${msg}`);
export const warn = (msg: string) => console.log(`  ${c.yellow}!${c.reset} ${msg}`);

const spinnerEnabled = process.stdout.isTTY === true;

export const withStatus = async <T>(message: string, fn: () => Promise<T>): Promise<T> => {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const started = Date.now();
  const interval = spinnerEnabled
    ? setInterval(() => process.stdout.write(`\r  ${frames[i++ % frames.length]} ${message}`), 80)
    : undefined;
  if (!spinnerEnabled) console.log(`  … ${message}`);
  try {
    const result = await fn();
    if (interval) clearInterval(interval);
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    process.stdout.write(`\r  ${c.green}✓${c.reset} ${message} ${c.gray}(${secs}s)${c.reset}\n`);
    return result;
  } catch (e) {
    if (interval) clearInterval(interval);
    process.stdout.write(`\r  ${c.red}✗${c.reset} ${message}\n`);
    throw e;
  }
};
