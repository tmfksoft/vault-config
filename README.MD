Vault-Config
===
This name is a in-development name until I find a suitable name for npm publishing.

## Usage
Using the module should be pretty straight forward.
To begin with, as a general rule it's a drop in replacement for the NodeJS `config` module.
Assuming you're only using the basic features, currently this *lacks* the more advanced features of `config` which may be added in future for full compat.

You'll want to create `config` directory and create a `default.js` with your configuration exported.

When you've setup your `default.js` configuration, you can then run `npx vault-config` to generate your Vault overrides, at this point you're ready to go.

Read the documentation below in order to fully understand how this works.

### Environment Variables
Like `config` this module respects your `NODE_ENV` environment variable.
This will dictate what `*.js` file is loaded, it will accept *any* `NODE_ENV` value and convert it to lowercase.

The most well known and recognised node environment values are of course `production` and `development`.

In order to take advantage of the Vault functionality, you'll need to set *two* or *three* environment variables depending on your setup.

If you're *only* using a Vault token, you'll want to set it in `VAULT_TOKEN`, you may already have this set if you're using the Vault CLI tool.

If you're using an "AppRole", which is strongly encouraged for production environments (and even development environments) you'll need to set `VAULT_ROLE_ID`, `VAULT_SECRET_ID` to their respective values.

For *both* setups, you'll need to set `VAULT_ADDR` to the base address of your Vault installation. You may already have this setup to use with Vault CLI.

### It's like a cake.
It's quite important to know how the configurations are loaded and in what order.

This is the order in which they're loaded

1. "default.js", loaded from disk
2. Vault overrides, applied over the top of the config in memory.
3. "[environment].js", loaded from disk (If it exists and this will be your `NODE_ENV`)
4. Vault overrides, applied ontop of the existing configurations.

Each configuration step merges ontop of the previous step.
The result is a single configuration in memory which can be accessed using the `get` method.

### It's cached, you know.
The module *doesn't* read from Vault every time you access data from the configuration. It also *doesn't* read from Vault on startup.
Instead a file named `.vault-overrides.json` can be populated.

When you've installed the module you can run it with `npx` to generate the `.vault-overrides.json` file.
When the module is ran it will read your configurations from disk as it normally would but instead it loads your Vault overrides directly from your Vault instance and writes all the changes to disk as `.vault-overrides.json`,
this allows your application to read configuration data without needing any further connection to Vault.

This feature *can* be used to provide development team members with preloaded Vault overrides without having to give them access to Vault.

### It's entirely up to you whether you commit your `.vault-overrides.json` just bear in mind you may be committing api keys. Whatever you put in Vault may end up in this file.

### Populating your cache during start or build
You may wish to populate your cache during a build or when starting your application each time.
This is useful for container environments such as Docker where you can simply reload your Vault config by restarting the container.

Or during the container build if you wish to bake it in. Though again, this may contain your API keys.

To do this, you can simply add `vault-config` to your `package.json` scripts:

```
  "scripts": {
    "build": "rm -rf dist && tsc",
    "start": "vault-config && node dist/index.js"
  },
```

### Reloading your Vault config or populating your cache programmatically.
In some situations you may wish to regenerate your `.vault-overrides.json` cache file on demand, either during runtime or via some form of tool.
This can be easily done by calling the `populate` method, this is a Promise which resolves when generation is complete.

See `src/populate.ts` for a really simple example of this.

When calling this method the Vault overrides will be replaced in memory allowing you to start using them straight away.
However, your application may need to take this into account if configuration options are set during startup such as when creating a HTTP Server.

`.vault-overrides.json` is only read during startup, if it changes on disk nothing will happen. You will need to restart your application.
This means calling `populate` outside of your main applications memory space will result in nothing happening during runtime.

A method may be added in future to force this.

### Reading Vault values and merging.
There's no easy way to explain how this works.
But, here goes.

The syntax is fairly straight forward.
Here's an example from one of my other projects:
```
module.exports = {
	"@": "vault:tbt.wtf/translate",
	httpd: {
		port: process.env["PORT"]
	},
};
```

Anything prefixed with `vault:` will be loaded from Vault.
The remainder is a path to the secret.
You can supply keys out of that secret like so:
"vault:tbt.wtf/translate.google.apiKey"
This is similar to how `config` and this module allows access to regular values.

You can set the Vault syntax as the value of a regular configuration value or using the "@" key.

Regular usage like so:
```
module.exports = {
	"sentry": {
		"dsn": "vault:tbt.wtf/translate.sentry.dsn",
	}
	httpd: {
		port: process.env["PORT"]
	},
};
```

You can use the "@" key to tell the module to merge that entire object.
In the following example, the entire Vault secret is merged ontop of the configuration.
```
module.exports = {
	"@": "vault:tbt.wtf/translate",
	httpd: {
		port: process.env["PORT"]
	},
};
```

In the example, Vault lacks the "httpd" key which is environment specific. As a result it isn't replaced.
But the local configuration lacks API Keys which are loaded into Vault.

There's no easy way to explain how this all works.

Hopefully this above explanation helps.
I can only suggest playing with this and inspecting the `config` property on the module which exposes the configuration as a whole.

### Pull requests and support
This module was created as part of my passion for programming, not as a tool intended to be used in actual production environments.
I encourage PR's to fix issues, outside of this limited support will be provided.

If you have some spare time to help improve documentation or create a Wiki that is most welcomed.
Let me know if you'd like to help!

If you're using this tool in your project, let me know. I'm interested to see where it finds use.

### Why?
I've gotten sick of setting a ton of environment variables in Docker containers when setting them up and configuring them.
Instead I'd like to use Vault to reduce the headache when setting containers up and maintaining them.

I couldn't find anything that did this on NPM, I'd also fallen in love with using `config` so I've created this which blends the best of both worlds.
Best of all, if you don't want to use the Vault functionality here, you don't have to.