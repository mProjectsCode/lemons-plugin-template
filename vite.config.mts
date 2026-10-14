import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createObsidianPluginConfig } from '@lemons_dev/lemons-obsidian-plugin-automation';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const wasmBinary = {
	name: 'wasm-binary',
	load(id: string) {
		if (id.endsWith('.wasm')) {
			return `export default Uint8Array.from(atob(${JSON.stringify(readFileSync(id).toString('base64'))}), c => c.charCodeAt(0));`;
		}
		return undefined;
	},
};

export default defineConfig(({ mode }) =>
	createObsidianPluginConfig({
		root,
		mode,
		entry: 'packages/obsidian/src/main.ts',
		plugins: [wasmBinary],
		resolve: { alias: { packages: path.join(root, 'packages') } },
		target: 'es2018',
	}),
);
