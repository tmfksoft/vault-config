declare class Config {
    config: any;
    private vConn;
    private roleId;
    private secretId;
    private vaultEndpoint;
    constructor();
    /**
     * Reads configuration from disk
     * @returns Loaded configuration, empty if none.
     */
    readConfig(): {};
    /**
     * Reads environment specific configuration from disk.
     * @returns Loaded configuration, empty if none.
     */
    readEnvironmentConfig(): {};
    loadVaultOverrides(): void;
    findVaultKeys(config: any, path?: string[], res?: {
        [key: string]: string;
    }): {
        [key: string]: string;
    };
    populate(): Promise<void>;
    get(path: string, defaultValue?: any): any;
    has(path: string): boolean;
}
declare const configInstance: Config;
export default configInstance;
