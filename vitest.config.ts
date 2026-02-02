import { defineConfig } from "vitest/config";
import { cargo } from "./vite-plugin-cargo";

export default defineConfig({
	plugins: [cargo({ includes: "src/**/lib.rs" })],
});
