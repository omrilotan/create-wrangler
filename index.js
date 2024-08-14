#!/usr/bin/env node

import { promises } from "node:fs";
import { join, basename } from "node:path";
import TOML from "@ltd/j-toml";
import { build } from "tsup";

const TEMP_TS_OUTPUT = "TEMP_TS_OUTPUT";

/**
 * @typedef {Object} Options
 * @property {string} [input=wragler.tmpl.js] - The source file to use as a template
 * @property {string} [output=<current directory>] - The destination directory to write the wragler.toml file to
 */
export async function createWrangler({
	input = "wrangler.tmpl.js",
	output = "",
}) {
	const sourceParts = [input];
	if (!input.startsWith("/")) {
		sourceParts.unshift(process.cwd());
	}
	let sourceFile = join(...sourceParts);
	const destinationParts = [
		output.replace(/wrangler\.toml$/, ""),
		"wrangler.toml",
	];
	if (output.startsWith("/")) {
		destinationParts.unshift(process.cwd());
	}
	const destinationFile = join(...destinationParts);
	console.info(`Parse ${sourceFile} to ${destinationFile}\n`);

	const { template } = await importOrCompile(sourceFile);
	if (typeof template !== "function") {
		throw new Error(`The source file must export a function named "template".`);
	}

	/**
	 * @typedef {Object} TOMLOptions
	 * @see https://github.com/LongTengDao/j-toml/tree/master/docs/English#arguments
	 */
	const TOMLOptions = {
		indent: "\t",
		newline: "\n",
		newlineAround: "section",
	};

	/**
	 * Create the TOML config file from Javascript and write it to disk
	 * @param {TOMLOptions} TOMLOptions
	 * @returns void
	 */
	const config = template(TOML);
	const content = TOML.stringify(config, TOMLOptions).trim();
	try {
		await promises.writeFile(destinationFile, content);
	} catch (error) {
		console.error(error);
	}
}

async function importOrCompile(sourceFile) {
	if (/\.c?js$/.test(sourceFile)) {
		return await import(sourceFile);
	}
	if (/\.ts$/.test(sourceFile)) {
		try {
			const outDir = join(process.cwd(), TEMP_TS_OUTPUT);
			await promises.mkdir(outDir, { recursive: true });
			await build({
				entry: [sourceFile],
				outDir: outDir,
				format: "esm",
				platform: "neutral",
				bundle: true,
				sourcemap: false,
			});
			sourceFile = join(outDir, basename(sourceFile).replace(/\.ts$/, ".js"));
			console.log({ sourceFile });
			const returnValue = await import(sourceFile);
			await promises.rm(outDir, { recursive: true });
			return returnValue;
		} catch (error) {
			await promises.rm(join(process.cwd(), TEMP_TS_OUTPUT), {
				recursive: true,
			});
			throw error;
		}
	}
	throw new Error(`Unsupported file type: ${sourceFile}`);
}
