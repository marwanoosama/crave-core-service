// Debug bootstrap: lets plain `node debug.mjs` run the TypeScript server.
// The imported loader (tsx) handles .ts resolution and source maps, so you can
// set breakpoints and step through the original TypeScript.
import 'tsx';
await import('./src/server.ts');
