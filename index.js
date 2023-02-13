#!/usr/bin/env node

import { promises } from "node:fs";
import { join } from "node:path";
import TOML from "@ltd/j-toml";

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
	const sourceFile = join(...sourceParts);
	const destinationParts = [
		output.replace(/wrangler\.toml$/, ""),
		"wrangler.toml",
	];
	if (output.startsWith("/")) {
		destinationParts.unshift(process.cwd());
	}
	const destinationFile = join(...destinationParts);
	console.info(`Parse ${sourceFile} to ${destinationFile}\n`);

	const inputFile = await import(sourceFile);
	if (typeof inputFile.template !== "function") {
		throw new Error(`The source file must export a function named "template".`);
	}
	const { template } = inputFile;

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
