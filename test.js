import test from "node:test";
import assert from "node:assert/strict";
import { promises } from "node:fs";
import { createWrangler } from "./index.js";

const output = "fixtures/wrangler.toml";

[
	["test.1.tmpl.js", "test.1.expected.toml"],
	["test.2.tmpl.ts", "test.2.expected.toml"],
	["test.3.tmpl.ts", "test.3.expected.toml"],
].forEach(([input, expected]) => {
	test(`should create a wrangler.toml file from ${input}`, async () => {
		await createWrangler({ input: `fixtures/${input}`, output });
		const context = await promises.readFile(output, "utf8");
		const expectedContext = await promises.readFile(
			`fixtures/${expected}`,
			"utf8",
		);
		assert.equal(context.trim(), expectedContext.trim());
	});
});
