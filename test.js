import { promises } from "node:fs";
import { createWrangler } from "./index.js";

const output = "fixtures/wrangler.toml";

describe("create-wrangler", () => {
	afterEach(async () => {
		await promises.rm(output);
	});
	it("should create a wrangler.toml file from a template", async () => {
		const input = "fixtures/template.1.js";
		await createWrangler({ input, output });
		const context = await promises.readFile(output, "utf8");
		expect(context).toMatchSnapshot();
	});
});
