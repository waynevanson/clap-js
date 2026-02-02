import { describe, test, expect } from "vitest";
import { ArgMatches, Command } from "../src/lib.rs";

describe("clap-js", () => {
	test("constructor", () => {
		expect(() => new Command("hello")).not.toThrow();
	});
});
