# create-wrangler [![](https://img.shields.io/npm/v/create-wrangler)](https://www.npmjs.com/package/create-wrangler)

🌩️ Create a wrangler.toml file from a programmable template, presented as a Javascript file

## Motivation

User maintains a programmable, testable file. Create, maintain and test complex configurations.

Repetitive parts can be used as variables and collections can be built with code. Some data can be excluded from the source code and made available as environment variables.

The code file is used to build a `wrangler.toml` file, to be used by `wrangler`.

| ![](https://github.com/user-attachments/assets/943e19d7-a67b-42c5-9ab7-44db576dabff)
| -

> ✔︎ Use programmatic constructs to build configuration
>
> ✔︎ Use environment variables to exclude sensitive data
>
> ✔︎ Test the configuration file
>
> ✔︎ Use Typescript or Javascript files
>
> ✔︎ Build the template asynchronously

## Usage

```sh
npm create wrangler -- [--input ./wrangler.tmpl.js] [--output ./wrangler.toml]
```

### Arguments

--input (-i): The path to the template file. Defaults to `./wrangler.tmpl.js` or `./wrangler.tmpl.ts`.

--output (-o): The path to the destination file. Defaults to `./wrangler.toml`.

--silent: Do not output the result to the console.

--help: Display help message.

### Input file

The input file exports a named function: `template`, which receives a single argument: [the TOML object](https://www.npmjs.com/package/@ltd/j-toml).

This file can be a Javascript (.js) or Typescript file (.ts)

```js
const {
	ACCOUNT_ID = "96b57b07c3394752a79b623f49bc5163",
	KV_NAMESPAC_ID = "798d14f4b4c949d185fcf39b0f593ac7",
} = process.env;
const ZONE = "example.com";
const subdomains = ["", "www.", "es."];
const paths = ["/", "/app*", "/admin*"];

export const template = async ({ Section }) => ({
	name: "my-worker",
	main: "src/index.ts",
	compatibility_date: "2022-07-04",
	workers_dev: false,
	account_id: ACCOUNT_ID,
	env: Section({
		production: {
			name: "my-worker-production",
			main: "src/index.ts",
			routes: subdomains.flatMap((subdomain) =>
				paths.map((path) => ({
					pattern: [subdomain, ZONE, path].join(""),
					zone_name: ZONE,
				})),
			),
			vars: Section({
				LOG_LEVEL: "warn",
				REMOTE_VARIABLE: await fetch(
					"https://example.com/remote-variable",
				).then((res) => res.text()),
			}),
			kv_namespaces: [
				{
					binding: "MY_KV_NAMESPACE",
					id: KV_NAMESPAC_ID,
				},
			],
			unsafe: {
				bindings: [
					Section({
						type: "analytics_engine",
						name: "MY_WORKER_ANALYTICS",
						dataset: "MY_WORKER_ANALYTICS",
					}),
				],
			},
		},
	}),
});
```

### Output file

The output file is a valid `wrangler.toml` file.

```toml
name = 'my-worker'
main = 'src/index.ts'
compatibility_date = '2022-07-04'
workers_dev = false
account_id = '96b57b07c3394752a79b623f49bc5163'

[env.production]
name = 'my-worker-production'
main = 'src/index.ts'
routes = [
	{ pattern = 'example.com/', zone_name = 'example.com' },
	{ pattern = 'example.com/app*', zone_name = 'example.com' },
	{ pattern = 'example.com/admin*', zone_name = 'example.com' },
	{ pattern = 'www.example.com/', zone_name = 'example.com' },
	{ pattern = 'www.example.com/app*', zone_name = 'example.com' },
	{ pattern = 'www.example.com/admin*', zone_name = 'example.com' },
	{ pattern = 'es.example.com/', zone_name = 'example.com' },
	{ pattern = 'es.example.com/app*', zone_name = 'example.com' },
	{ pattern = 'es.example.com/admin*', zone_name = 'example.com' },
]
kv_namespaces = [
	{ binding = 'MY_KV_NAMESPACE', id = '798d14f4b4c949d185fcf39b0f593ac7' },
]

[env.production.vars]
LOG_LEVEL = 'warn'

[[env.production.unsafe.bindings]]
type = 'analytics_engine'
name = 'MY_WORKER_ANALYTICS'
dataset = 'MY_WORKER_ANALYTICS'

```

### package.json entry

In this example, the `predeploy` script will create the `wrangler.toml` file before the `deploy` script runs `wrangler deploy`.

```json
{
	"scripts": {
		"predeploy": "npm_config_yes=true npm create wrangler",
		"deploy": "wrangler deploy"
	}
}
```
