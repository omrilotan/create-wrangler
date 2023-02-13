#!/usr/bin/env node

import { parseArgs } from "node:util";
import { createWrangler } from "./index.js";

const HELP = [
	"cretae-wrangler: Create a wrangler.toml file from a template",
	"------------------------------------------------------------",
	"Usage: npm create wrangler -- --input=wrangler.tmpl.cjs --output=wrangler.toml",
].join("\n");

const [, , ...args] = process.argv;

const {
	values: { input, output, help },
} = parseArgs({
	args,
	options: {
		input: {
			type: "string",
			alias: "si",
		},
		output: {
			type: "string",
			alias: "0",
		},
		help: {
			type: "boolean",
			alias: "h",
		},
	},
	allowPositionals: true,
});

if (help) {
	console.log(HELP);
	process.exit(0);
}

try {
	createWrangler({ input, output });
} catch (error) {
	console.error(error);
	console.info(`\n\n\n${HELP}`);
	process.exit(1);
}
