import test from "node:test";
import assert from "node:assert/strict";
import { promises } from "node:fs";
import { createWrangler } from "./index.js";

const output = "fixtures/wrangler.toml";

[
	["template.1.js", "template.1.toml"],
	["template.2.ts", "template.2.toml"],
	["template.3.ts", "template.3.toml"],
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
