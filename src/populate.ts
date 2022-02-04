import Config from './index';

console.log("Populating Vault Overrides, please wait!");
Config.populate().then(() => {
	console.log("Done!");
	console.log("Please check that 'vault.json' looks correct.");
});