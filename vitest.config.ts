import { defineConfig, type Plugin } from "vitest/config";
import wasm from "vite-plugin-wasm";
import picomatch from "picomatch";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as v from "valibot";
import { createHash } from "node:crypto";

export default defineConfig({
	plugins: [
		cargo({
			includes: "**/src/lib.rs",
		}),
		wasm(),
	],
});

type MetadaSchemaOptions = { project: string; id: string };

const MetadataSchema = (options: MetadaSchemaOptions) =>
	v.nonNullish(
		v.pipe(
			v.object({
				packages: v.array(
					v.pipe(
						v.object({
							manifest_path: v.string(),
							targets: v.array(
								v.object({
									kind: v.array(v.string()),
									name: v.string(),
									src_path: v.string(),
								}),
							),
						}),
						v.transform((package_) =>
							package_.targets.flatMap((target) =>
								target.kind.flatMap((kind) => ({
									manifest_path: package_.manifest_path,
									...target,
									kind,
								})),
							),
						),
					),
				),
			}),
			v.transform((packages) => packages.packages.flat()),
			v.findItem((metadata) =>
				v.is(
					v.object({
						manifest_path: v.literal(options.project),
						name: v.string(),
						src_path: v.literal(options.id),
						kind: v.literal("cdylib"),
					}),
					metadata,
				),
			),
		),
	);

function getClosestCargoProject(id: string) {
	return execFileSync("cargo", ["locate-project", "--message-format=plain"], {
		stdio: ["ignore", "pipe", "ignore"],
		encoding: "utf-8",
		cwd: path.dirname(id),
	}).trim();
}

function ensureRustLibraryMetadata(options: MetadaSchemaOptions) {
	// validate if the file is the entrypoint to a cdylib target as rust lib
	const metacontent = execFileSync(
		"cargo",
		["metadata", "--no-deps", "--format-version=1"],
		{
			cwd: path.dirname(options.id),
			encoding: "utf-8",
		},
	).trim();

	// find the right library from our file
	const metadata = v.parse(MetadataSchema(options), JSON.parse(metacontent));

	return metadata;
}

function compileLibrary(options: MetadaSchemaOptions, isServe: boolean) {
	// create `.wasm` from `.rs`
	const ndjson = execFileSync(
		"cargo",
		[
			"build",
			"--lib",
			"--target=wasm32-unknown-unknown",
			"--message-format=json",
			"--color=never",
			"--quiet",
			isServe || "--release",
		].filter((a): a is string => typeof a === "string"),
		{
			cwd: path.dirname(options.id),
			encoding: "utf-8",
			stdio: ["ignore", "pipe", "ignore"],
		},
	);

	const json = ndjson
		.trim()
		.split("\n")
		.map((json) => JSON.parse(json));

	const filename: string = json
		.filter((a) => a?.reason === "compiler-artifact")
		.filter((a) => a?.manifest_path === options.project)[0]?.filenames?.[0];

	return filename;
}

// 1. Plugin for Rust -> WASM -> WASM + ESM
function cargo(
	pluginOptions: {
		includes: picomatch.Glob;
	} & (
		| { noDefaultFeatures?: boolean; features?: Array<string> }
		| { allFeatures: true }
	),
): Plugin<never> {
	const matches = picomatch(pluginOptions.includes, { cwd: path.resolve() });

	// find the entry

	let isServe = false;

	const libraries = new Map<
		string,
		{ outDir: string; project: string; id: string }
	>();

	return {
		name: "vite-plugin-cargo",
		configResolved(config) {
			isServe = config.command === "serve";
		},

		async resolveId(source, importer) {
			// check if this import came from one of our entrypoints
			const entry = libraries
				.entries()
				.map(([hash, library]) => ({ hash, ...library }))
				.find((library) => library.id === importer);

			if (entry === undefined) {
				return null;
			}

			// ensure source is relative to wasm_bindgen output dir
			return path.resolve(entry.outDir, source);
		},
		// so virtual modules can't have file extensions, noted.
		async transform(_code, id) {
			if (!matches(id)) {
				return null;
			}

			const project = getClosestCargoProject(id);
			const options = { id, project };
			const metadata = ensureRustLibraryMetadata(options);
			const hash = createHash("sha256")
				.update(`${project}:${id}`)
				.digest("hex");

			const outDir = path.resolve(
				`node_modules/.cache/vite-plugin-cargo/${hash}`,
			);

			libraries.set(hash, { id, outDir, project });

			const wasm = compileLibrary(options, isServe);

			// I think this needs to create files via vite/rollup

			// create `.js` from `.wasm`
			execFileSync(
				"wasm-bindgen",
				[
					"--target=bundler",
					`--out-dir=${outDir}`,
					isServe && `--debug`,
					wasm,
				].filter((a): a is string => typeof a === "string"),
			);

			const js = path.resolve(outDir, `${metadata.name}.js`);
			const content = await this.fs.readFile(js, { encoding: "utf8" });

			// symlink <name>.d.ts to the <id>.d.ts
			const source = path.join(outDir, `${metadata.name}.d.ts`);
			const target = `${id}.d.ts`;
			await this.fs.copyFile(source, target);

			return {
				code: content,
			};
		},
	};
}
