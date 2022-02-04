"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var node_vault_1 = __importDefault(require("node-vault"));
var path_1 = __importDefault(require("path"));
var _ = __importStar(require("lodash"));
var Config = /** @class */ (function () {
    function Config() {
        this.vaultMemory = {};
        this.config = {};
        this.roleId = process.env["VAULT_ROLE_ID"];
        this.secretId = process.env["VAULT_SECRET_ID"];
        this.vaultEndpoint = process.env["VAULT_ADDR"];
        this.vConn = node_vault_1.default({
            token: process.env['VAULT_TOKEN'],
            endpoint: this.vaultEndpoint,
        });
        this.config = this.readConfig();
        this.loadVaultOverrides();
    }
    /**
     * Reads configuration from disk
     * @returns Loaded configuration, empty if none.
     */
    Config.prototype.readConfig = function () {
        var environment = process.env['NODE_ENV'] || "development";
        var baseConfig = {};
        var regularConfig = path_1.default.join(process.cwd(), "config", "default.js");
        if (fs_1.default.existsSync(regularConfig)) {
            baseConfig = _.cloneDeep(require(regularConfig));
        }
        var envConfig = path_1.default.join(process.cwd(), "config", environment.toLowerCase() + ".js");
        if (fs_1.default.existsSync(envConfig)) {
            baseConfig = _.merge(baseConfig, _.cloneDeep(require(envConfig)));
        }
        return baseConfig;
    };
    Config.prototype.loadVaultOverrides = function () {
        var vaultConfig = path_1.default.join(process.cwd(), "vault.json");
        if (fs_1.default.existsSync(vaultConfig)) {
            try {
                var raw = fs_1.default.readFileSync(vaultConfig);
                this.vaultMemory = JSON.parse(raw.toString());
                var configVaultKeys = this.findVaultKeys(this.config);
                for (var vaultKey in configVaultKeys) {
                    _.unset(this.config, vaultKey);
                }
                this.config = _.merge(this.config, this.vaultMemory);
            }
            catch (e) {
                // Do nothing, I'm lazy.
                throw e;
            }
        }
    };
    Config.prototype.findVaultKeys = function (config, path, res) {
        if (path === void 0) { path = []; }
        if (res === void 0) { res = {}; }
        var keys = !!config && typeof config === 'object' ? Object.keys(config) : [];
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            if (typeof config[key] === 'string') {
                if (config[key].startsWith('vault:')) {
                    res[__spreadArray(__spreadArray([], path), [key]).join('.')] = config[key].split('vault:').slice(1).join(':');
                }
            }
            else {
                this.findVaultKeys(config[key], __spreadArray(__spreadArray([], path), [key]), res);
            }
        }
        return res;
    };
    Config.prototype.populate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var vanillaConfig, vaultOverrides, vaultKeys, vaultConfig;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vanillaConfig = this.readConfig();
                        vaultOverrides = {};
                        vaultKeys = this.findVaultKeys(vanillaConfig);
                        if (!(this.roleId && this.secretId)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.vConn.approleLogin({
                                role_id: this.roleId,
                                secret_id: this.secretId,
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: 
                    // STORE /  data / PAATH/PATH/PATH/....PATH/KEY.KVKEY.KVKEY
                    return [4 /*yield*/, Promise.all(Object.keys(vaultKeys).map(function (vKey) {
                            var vaultReadPath = vaultKeys[vKey];
                            var pathSplit = vaultReadPath.split("/");
                            var vaultStore = pathSplit[0];
                            var pathPieces = [
                                vaultStore,
                                "data"
                            ];
                            for (var i = 1; i < pathSplit.length; i++) {
                                var piece = pathSplit[i];
                                if (i === pathSplit.length - 1 && piece.indexOf(".") >= 0) {
                                    var pieceSplit = piece.split(".");
                                    if (pieceSplit.length > 0) {
                                        pathPieces.push(pieceSplit[0]);
                                        break;
                                    }
                                }
                                pathPieces.push(piece);
                            }
                            var vaultPath = pathPieces.join("/");
                            var vaultObjectPath = pathSplit[pathSplit.length - 1].split(".").slice(1).join("."); // Screaming.
                            return _this.vConn.read(vaultPath)
                                .then(function (value) {
                                var objData = value.data.data;
                                var vaultRead = vaultObjectPath ? _.get(objData, vaultObjectPath) : objData;
                                if (vKey.endsWith('.@')) {
                                    vaultOverrides = _.set(vaultOverrides, vKey.substring(0, vKey.length - 2), vaultRead);
                                }
                                else if (vKey === '@') {
                                    vaultOverrides = _.merge(vaultOverrides, vaultRead);
                                }
                                else {
                                    vaultOverrides = _.set(vaultOverrides, vKey, vaultRead);
                                }
                            }).catch(function (e) {
                                console.log(e);
                                vaultOverrides = _.set(vaultOverrides, vKey, undefined);
                            });
                        }))];
                    case 3:
                        // STORE /  data / PAATH/PATH/PATH/....PATH/KEY.KVKEY.KVKEY
                        _a.sent();
                        vaultConfig = path_1.default.join(process.cwd(), "vault.json");
                        fs_1.default.writeFileSync(vaultConfig, JSON.stringify(vaultOverrides));
                        this.config = vanillaConfig;
                        this.loadVaultOverrides();
                        return [2 /*return*/];
                }
            });
        });
    };
    Config.prototype.get = function (path, defaultValue) {
        return _.get(this.config, path, defaultValue);
    };
    Config.prototype.has = function (path) {
        return _.has(this.config, path);
    };
    return Config;
}());
var configInstance = new Config();
exports.default = configInstance;
