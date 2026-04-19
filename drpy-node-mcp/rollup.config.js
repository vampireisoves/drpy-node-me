import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    writeBundle() {
      const assets = ['skills.md', 'skills-zh.md'];
      const outDir = join(__dirname, 'dist');
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      for (const file of assets) {
        const src = join(__dirname, file);
        if (existsSync(src)) {
          copyFileSync(src, join(outDir, file));
          console.log(`Copied ${file} -> dist/${file}`);
        }
      }
    }
  };
}

export default {
  input: 'index.js',
  output: {
    file: 'dist/index.js',
    format: 'esm',
    banner: '#!/usr/bin/env node',
    inlineDynamicImports: true,
  },
  treeshake: false,
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    copyAssetsPlugin(),
  ],
  external: [
    // Node.js built-ins
    'fs', 'path', 'url', 'util', 'stream', 'events', 'buffer', 'crypto',
    'child_process', 'os', 'http', 'https', 'net', 'tls', 'zlib',
    // Native modules that shouldn't be bundled
    'node-sqlite3-wasm',
    // MCP SDK - keep external for proper ESM
    '@modelcontextprotocol/sdk',
  ],
  onwarn: function(warning, warn) {
    if (['CIRCULAR_DEPENDENCY', 'EVAL'].includes(warning.code)) {
      return;
    }
    warn(warning);
  },
};
