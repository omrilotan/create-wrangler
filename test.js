import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readFile, writeFile, rm, access, constants } from "node:fs/promises";
import { rimraf } from "rimraf";
import { createWrangler } from "./index.js";

const FIXTURES_DIR = "fixtures";
const WRANGLER_TMPL =
	"export const template = () => ({name: 'my-worker', main: 'src/index.ts'});";

async function exists(file) {
	try {
		await access(file, constants.F_OK);
		return true;
	} catch (error) {
		return false;
	}
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rand = () => Math.random().toString(36).slice(2);

describe("createWrangler", () => {
	afterEach(async () => {
		await rimraf("./wrangler.*", { glob: true });
		await rm("./output", { recursive: true, force: true });
	});
	[
		["test.1.tmpl.js", "test.1.expected.toml"],
		["test.2.tmpl.ts", "test.2.expected.toml"],
		["test.3.tmpl.ts", "test.3.expected.toml"],
	].forEach(([input, expected]) => {
		it(`should create a wrangler.toml file from ${input}`, async () => {
			const outputFile = `wrangler.toml`;
			await createWrangler({
				input: `${FIXTURES_DIR}/${input}`,
				output: outputFile,
			});
			const content = await readFile(outputFile, "utf8");
			const expectedContent = await readFile(
				`${FIXTURES_DIR}/${expected}`,
				"utf8",
			);
			assert.equal(content.trim(), expectedContent.trim());
		});
	});

	it("should find the wrangler.tmpl.js file", async () => {
		await writeFile("wrangler.tmpl.js", WRANGLER_TMPL);
		assert.rejects(async () => await access("wrangler.toml"));
		await createWrangler();
		assert.doesNotReject(async () => await access("wrangler.toml"));
	});
	it("should find the wrangler.tmpl.ts file", async () => {
		await writeFile("wrangler.tmpl.ts", WRANGLER_TMPL);
		assert.rejects(async () => await access("wrangler.toml"));
		await createWrangler();
		assert(await exists("wrangler.toml"));
	});
	it("should fail for wrangler.tmpl.tsx file", async () => {
		await writeFile("wrangler.tmpl.tsx", WRANGLER_TMPL);
		assert.rejects(createWrangler);
	});
	it('should fail when to "template" function is exported', async () => {
		const input = `wrangler.tmpl.${rand()}.js`;
		await writeFile(
			input,
			"export const build = () => ({name: 'my-worker', main: 'src/index.ts'});",
		);
		assert.rejects(async () => await createWrangler({ input: input }));
	});
	it("should throw an error if no input file is found", async () => {
		assert.rejects(async () => await createWrangler());
	});
	it("should clean up if import fails (ts)", async () => {
		const input = `wrangler.tmpl.${rand()}.js`;
		await writeFile(input, "export const template = () => ({syntax error});");
		assert.rejects(async () => await createWrangler({ input: input }));
		await wait(100); // avoid race condition
		assert.equal(await exists("TEMP_TS_OUTPUT"), false);
	});
	it("should fail when destination is not writable", async () => {
		const input = `wrangler.tmpl.${rand()}.js`;
		await writeFile(input, WRANGLER_TMPL);
		assert.rejects(
			async () =>
				await createWrangler({
					input,
					output: "/dev/null/directory/wrangler.toml",
				}),
		);
	});
	it("should place files in the output directory", async () => {
		await writeFile("wrangler.tmpl.js", WRANGLER_TMPL);
		await createWrangler({
			output: join(process.cwd(), "output", "wrangler.toml"),
		});
		assert.equal(await exists("output/wrangler.toml"), true);
	});
});
