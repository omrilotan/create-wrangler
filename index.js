#!/usr/bin/env node

import { access, writeFile, mkdir, rm } from "node:fs/promises";
import { join, basename } from "node:path";
import TOML from "@ltd/j-toml";
import { build } from "tsup";

const TEMP_TS_OUTPUT = "TEMP_TS_OUTPUT";

/**
 * @typedef {Object} Options
 * @property {string} [input=wragler.tmpl.js] - The source file to use as a template
 * @property {string} [output=<current directory>] - The destination directory to write the wragler.toml file to
 */
export async function createWrangler({ input, output = "" } = {}) {
	if (!input) {
		try {
			await access("wrangler.tmpl.js");
			input = "wrangler.tmpl.js";
		} catch (error) {
			// ignore
		}
	}
	if (!input) {
		try {
			await access("wrangler.tmpl.ts");
			input = "wrangler.tmpl.ts";
		} catch (error) {
			// ignore
		}
	}
	if (!input) {
		throw new Error(`No input file provided. (e.g. --input wrangler.tmpl.js)`);
	}

	const sourceParts = [input];
	if (!input.startsWith("/")) {
		sourceParts.unshift(process.cwd());
	}
	let sourceFile = join(...sourceParts);
	const destinationParts = [
		output.replace(/wrangler\.toml$/, ""),
		"wrangler.toml",
	];
	if (!output.startsWith("/")) {
		destinationParts.unshift(process.cwd());
	}
	const destinationFile = join(...destinationParts);

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
	const config = await template(TOML);
	const content = TOML.stringify(config, TOMLOptions).trim();
	try {
		// Create the destination directory if it doesn't exist
		await mkdir(join(destinationFile, ".."), { recursive: true });
		await writeFile(destinationFile, content);
		return `Parsed ${sourceFile} to ${destinationFile}`;
	} catch (error) {
		throw error;
	}
}

async function importOrCompile(sourceFile) {
	if (/\.c?js$/.test(sourceFile)) {
		return await import(sourceFile);
	}
	if (/\.m?ts$/.test(sourceFile)) {
		try {
			return await import(sourceFile, { assert: { type: "ts" } });
		} catch (error) {
			// Unsupported file or directory imports can be worked around with the typescript compiler
			if (
				!["ERR_UNSUPPORTED_DIR_IMPORT", "ERR_UNKNOWN_FILE_EXTENSION"].includes(
					error.code,
				)
			) {
				console.log("Error importing TypeScript", sourceFile);
				throw error;
			}
		}
		try {
			console.log("Compiling TypeScript file with tsup...");
			const outDir = join(process.cwd(), TEMP_TS_OUTPUT);
			await mkdir(outDir, { recursive: true });
			await build({
				entry: [sourceFile],
				outDir: outDir,
				format: "esm",
				platform: "neutral",
				bundle: true,
				sourcemap: false,
				silent: true,
			});
			sourceFile = join(outDir, basename(sourceFile).replace(/\.ts$/, ".js"));
			const returnValue = await import(sourceFile);
			await rm(outDir, { recursive: true });
			return returnValue;
		} catch (error) {
			await rm(join(process.cwd(), TEMP_TS_OUTPUT), {
				recursive: true,
			});
			throw error;
		}
	}
	throw new Error(`Unsupported file type: ${sourceFile}`);
}
