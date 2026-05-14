const { spawn } = require('child_process');

const children = [];

function run(name, command) {
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env },
  });
  children.push(child);
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`[${name}] exited with code ${code}`);
  });
}

run('api', 'npm run dev:api');
run('vite', 'npm run dev');

const shutdown = () => {
  for (const child of children) child.kill();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
