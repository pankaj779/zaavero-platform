/**
 * Local/CI bundle verification.
 * Production store binaries are produced by EAS (`eas build`) with Hermes.
 *
 * On Windows, pnpm's deep virtual-store paths exceed MAX_PATH (260) when
 * spawning hermesc.exe, so local export uses JSC unless EXPO_JS_ENGINE=hermes
 * is set explicitly (Linux/macOS CI and EAS use Hermes by default via app.json).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === 'win32';
const jsEngine = process.env.EXPO_JS_ENGINE ?? (isWin ? 'jsc' : 'hermes');

const result = spawnSync(
  'pnpm',
  ['exec', 'expo', 'export', '--platform', 'android', '--output-dir', 'dist'],
  {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      EXPO_JS_ENGINE: jsEngine,
    },
  },
);

process.exit(result.status ?? 1);
