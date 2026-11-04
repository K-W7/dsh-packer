# src/client（从 lib/client.js 解包）

这些文件是从已发布的 `lib/client.js`（esbuild 产物）按 `// src/client/...` 模块注释切分出来的，**不是原始 TypeScript 源码**：类型标注、import/export 结构已在打包时丢失，文件内容是可读的编译后 JS。

`scripts/build-client.mjs` 按文件名前缀顺序把 `00-runtime.js` + `01..14` 直接拼接，重建 `lib/client.js`。拼接结果与原始产物字节级一致（见提交说明），因此可以这样维护和发布；改动某个模块后重跑 `npm run build` 即可。
