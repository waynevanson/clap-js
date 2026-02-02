import { cargo } from "@waynevanson/vite-plugin-cargo";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [cargo({ includes: "src/**/lib.rs" })],
});
