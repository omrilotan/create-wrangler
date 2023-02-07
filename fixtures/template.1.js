const subdomains = ["", "www.", "es."];
const paths = ["/", "/app*", "/admin*"];
const ZONE = "example.com";

const {
	ACCOUNT_ID = "96b57b07c3394752a79b623f49bc5163",
	KV_NAMESPAC_ID = "798d14f4b4c949d185fcf39b0f593ac7",
} = process.env;

export const template = ({ Section }) => ({
	name: "my-worker",
	main: "src/index.ts",
	compatibility_date: "2022-07-04",
	workers_dev: false,
	account_id: ACCOUNT_ID,
	env: {
		production: Section({
			name: "my-worker-production",
			main: "src/index.ts",
			routes: subdomains.flatMap((subdomain) =>
				paths.map((path) => ({
					pattern: [subdomain, ZONE, path].join(""),
					zone_name: ZONE,
				}))
			),
			vars: Section({
				LOG_LEVEL: "warn",
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
		}),
	},
});
