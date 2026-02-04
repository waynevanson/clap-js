import { cargo } from "@waynevanson/vite-plugin-cargo";
import wasm from "vite-plugin-wasm";
import { defineConfig } from "vitest/config";

export default defineConfig({
	build: {
		lib: {
			entry: "src/lib.rs",
			formats: ["es"],
		},
		outDir: "dist",
	},
	plugins: [
		cargo({
			includes: "**/src/**/*.rs",
		}),
		wasm(),
	],
});
