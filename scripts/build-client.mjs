import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 由 src/client/ 下的分片重建 lib/client.js。
// 分片来自 esbuild 产物按 `// src/client/...` 注释切分，顺序由文件名前缀固定；
// 内容是可读的编译后 JS，不是原始 TypeScript（类型与 import 结构已丢失）。
const clientDir = new URL('../src/client/', import.meta.url);
const outFile = fileURLToPath(new URL('../lib/client.js', import.meta.url));

const parts = readdirSync(clientDir)
  .filter((name) => /^\d{2}-.+\.(js|ts)$/.test(name))
  .sort();

if (!parts.length) throw new Error('src/client/ 下没有分片');

const text = parts
  .map((name) => readFileSync(new URL(name, clientDir), 'utf8'))
  .join('');

writeFileSync(outFile, text);
console.log(`built lib/client.js from ${parts.length} parts (${text.length} chars)`);
