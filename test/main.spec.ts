import { describe, expect, test } from "vitest";
import { ArgMatches, Command } from "../src/lib.rs";

describe("clap-js", () => {
	describe("construct", () => {
		test("constructor", () => {
			expect(() => new Command("")).not.toThrow();

			const instance = new Command("");
			expect(instance).toBeInstanceOf(Command);
		});

		test("from", () => {
			expect(() => Command.default()).not.toThrow();

			const instance = Command.default();
			expect(instance).toBeInstanceOf(Command);
		});
	});

	describe("instance", () => {
		test("ArgMatches", () => {
			const instance = Command.default();
			const argMatches = instance.getMatches();
			expect(argMatches).toBeInstanceOf(ArgMatches);
		});
	});
});
