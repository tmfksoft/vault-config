import fs from 'fs';
import Vault from 'node-vault';
import path from 'path';
import * as _ from 'lodash';

class Config {
	// Merged version of all configurations
	public config: any = {};

	// Vault
	private vConn: Vault.client;
	private roleId = process.env["VAULT_ROLE_ID"];
	private secretId = process.env["VAULT_SECRET_ID"];
	private vaultEndpoint = process.env["VAULT_ADDR"];

	constructor() {

		this.vConn = Vault({
			token: process.env['VAULT_TOKEN'],
			endpoint: this.vaultEndpoint,
		});

		this.config = this.readConfig();
		// Overlay the environment config overrides. - UNIMPLEMENTED, I'll need to do some refactoring.
		// Useful when production may wish to force set something different in the environment or during devleopment to override.
		this.config = _.merge(this.config, this.readEnvironmentConfig());

		this.loadVaultOverrides();
	}

	/**
	 * Reads configuration from disk
	 * @returns Loaded configuration, empty if none.
	 */
	readConfig() {
		let baseConfig = {};

		const regularConfig = path.join(process.cwd(), "config", "default.js");
		if (fs.existsSync(regularConfig)) {
			baseConfig = _.cloneDeep(require(regularConfig));
		}
		return baseConfig;
	}

	/**
	 * Reads environment specific configuration from disk.
	 * @returns Loaded configuration, empty if none.
	 */
	readEnvironmentConfig() {
		const environment = process.env['NODE_ENV'] || "development";

		let baseConfig = {};

		const envConfig = path.join(process.cwd(), "config", `${environment.toLowerCase()}.js`);
		if (fs.existsSync(envConfig)) {
			baseConfig = _.merge(baseConfig, _.cloneDeep(require(envConfig)));
		}

		return baseConfig;
	}

	loadVaultOverrides() {
		const vaultConfig = path.join(process.cwd(), ".vault-overrides.json");
		if (fs.existsSync(vaultConfig)) {
			try {
				const raw = fs.readFileSync(vaultConfig);
				const vaultMemory = JSON.parse(raw.toString());

				const configVaultKeys = this.findVaultKeys(this.config);
				for (let vaultKey in configVaultKeys) {
					_.unset(this.config, vaultKey);
				}

				this.config = _.merge(this.config, vaultMemory);

			} catch (e) {
				// Do nothing, I'm lazy.
				throw e;
			}
		}
	}

	findVaultKeys(
		config: any,
		path: string[] = [],
		res: { [key: string]: string } = {},
	): { [key: string]: string } {
		const keys: string[] = !!config && typeof config === 'object' ? Object.keys(config) : [];

		for (const key of keys) {
			if (typeof config[key] === 'string') {
				if ((<string>config[key]).startsWith('vault:')) {
					res[[...path, key].join('.')] = (<string>config[key]).split('vault:').slice(1).join(':');
				}
			} else {
				this.findVaultKeys(config[key], [...path, key], res);
			}
		}

		return res;
	}

	async populate() {
		// Load clean config.
		let vanillaConfig = _.merge(this.readConfig(), this.readEnvironmentConfig());
		let vaultOverrides: any = {};

		const vaultKeys = this.findVaultKeys(vanillaConfig);

        // Use kubernetes authentication if we have a service 
        if (fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token')) {
            const token = await fs.promises.readFile('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');

            await this.vConn.kubernetesLogin({
                role: process.env['VAULT_KUBERNETES_ROLE'] ?? 'anonymous',
                jwt: token,
                mount_point: process.env['VAULT_KUBERNETES_MOUNT'] ?? 'kubernetes',
            });
        }

		// Use app role if provided.
		if (this.roleId && this.secretId) {
			await this.vConn.approleLogin({
				role_id: this.roleId,
				secret_id: this.secretId,
			});
		}

		// STORE /  data / PAATH/PATH/PATH/....PATH/KEY.KVKEY.KVKEY
		await Promise.all(
			Object.keys(vaultKeys).map(vKey => {
				const vaultReadPath = vaultKeys[vKey];
				const pathSplit = vaultReadPath.split("/");
	
				const vaultStore = pathSplit[0];
	
				let pathPieces = [
					vaultStore,
					"data"
				];
				for (let i=1; i<pathSplit.length; i++) {
					let piece = pathSplit[i];
					if (i === pathSplit.length - 1 && piece.indexOf(".") >= 0) {
						let pieceSplit = piece.split(".");
						if (pieceSplit.length > 0) {
							pathPieces.push(pieceSplit[0]);
							break;
						}
					}
					pathPieces.push(piece);
				}
				const vaultPath = pathPieces.join("/");
				const vaultObjectPath = pathSplit[pathSplit.length - 1].split(".").slice(1).join("."); // Screaming.
	
				return this.vConn.read(vaultPath)
				.then(value => {
					const objData = value.data.data;
					const vaultRead = vaultObjectPath ? _.get(objData, vaultObjectPath) : objData;
					if (vKey.endsWith('.@')) {
						vaultOverrides = _.set(vaultOverrides, vKey.substring(0, vKey.length - 2), vaultRead);
					} else if (vKey === '@') {
						vaultOverrides = _.merge(vaultOverrides, vaultRead);
					} else {
						vaultOverrides = _.set(vaultOverrides, vKey, vaultRead);
					}
				}).catch( e => {
					console.log(e);
					vaultOverrides = _.set(vaultOverrides, vKey, undefined);
				})
			})
		);

		const vaultConfig = path.join(process.cwd(), ".vault-overrides.json");
		fs.writeFileSync(vaultConfig, JSON.stringify(vaultOverrides));

		// Refresh the in-memory configuration in the event this method is called during runtime in an app.
		this.config = vanillaConfig;
		this.config = _.merge(this.config, this.readEnvironmentConfig());
		this.loadVaultOverrides();
		
	}

	get(path: string, defaultValue?: any) {
		return _.get(this.config, path, defaultValue);
	}
	has(path: string) {
		return _.has(this.config, path);
	}
}

const configInstance = new Config();
export default configInstance;