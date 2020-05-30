"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
Object.defineProperty(exports, "__esModule", { value: true });
var tile_utils_1 = require("@yaga/tile-utils");
var consts_1 = require("./consts");
var emitter_1 = require("./emitter");
/**
 * Class for a spatial-tile-cache that stores its data in the browsers IndexedDB
 */
var IndexedDbTileCache = /** @class */ (function (_super) {
    __extends(IndexedDbTileCache, _super);
    function IndexedDbTileCache(options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.options = options;
        _this.options.databaseName = _this.options.databaseName || consts_1.DEFAULT_DATABASE_NAME;
        _this.options.databaseVersion = _this.options.databaseVersion || consts_1.DEFAULT_DATABASE_VERSION;
        _this.options.objectStoreName = _this.options.objectStoreName || consts_1.DEFAULT_OBJECT_STORE_NAME;
        _this.options.tileUrl = _this.options.tileUrl || consts_1.DEFAULT_TILE_URL;
        _this.options.tileUrlSubDomains = _this.options.tileUrlSubDomains || consts_1.DEFAULT_TILE_URL_SUB_DOMAINS;
        _this.options.crawlDelay = _this.options.crawlDelay || consts_1.DEFAULT_CRAWL_DELAY;
        _this.options.maxAge = _this.options.maxAge || consts_1.DEFAULT_MAX_AGE;
        // Create the store if it does not exists...
        var dbRequest = indexedDB.open(_this.options.databaseName, _this.options.databaseVersion);
        dbRequest.addEventListener("upgradeneeded", function (dbEvent) {
            /**
             * Fired event from IndexedDB to give the possibility to enhance something on the store
             * @event IndexedDbTileCache#upgradeneeded
             */
            _this.dispatchEvent(new CustomEvent("upgradeneeded", {
                detail: dbEvent,
            }));
            var database = dbEvent.target.result;
            database.createObjectStore(_this.options.objectStoreName, {
                keyPath: "url",
            });
        });
        dbRequest.addEventListener("error", function (dbEvent) {
            /**
             * Piping the error event
             * @event IndexedDbTileCache#upgradeneeded
             */
            _this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
        });
        return _this;
    }
    /**
     * Get the internal tile entry from the database with all its additional meta information.
     *
     * If the tile is marked as outdated by the `IIndexedDbTileCacheOptions.maxAge` property, it tries to download it
     * again. On any error it will provide the cached version.
     *
     * If you pass `true` as parameter for the `downloadIfUnavaiable` argument, it tries to dowenload a tile if it is
     * not stored already.
     */
    IndexedDbTileCache.prototype.getTileEntry = function (tileCoordinates, downloadIfUnavaiable) {
        var _this = this;
        var dbRequest = indexedDB.open(this.options.databaseName, this.options.databaseVersion);
        return new Promise(function (resolve, reject) {
            dbRequest.addEventListener("success", function (dbEvent) {
                var database = dbEvent.target.result;
                var tx = database
                    .transaction([_this.options.objectStoreName])
                    .objectStore(_this.options.objectStoreName)
                    .get(_this.createInternalTileUrl(tileCoordinates));
                tx.addEventListener("success", function (event) {
                    if (!event.target.result) {
                        if (downloadIfUnavaiable) {
                            return _this.downloadTile(tileCoordinates).then(resolve, reject);
                        }
                        return reject(new Error("Unable to find entry"));
                    }
                    var tileEntry = event.target.result;
                    if (tileEntry.timestamp < Date.now() - _this.options.maxAge) {
                        // Too old
                        return _this.downloadTile(tileCoordinates)
                            .catch(function () {
                            // Not available so keep cached version...
                            return resolve(tileEntry);
                        })
                            .then(resolve);
                    }
                    resolve(tileEntry);
                });
                tx.addEventListener("error", function (event) {
                    _this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
                    reject(event.target.error);
                });
            });
            dbRequest.addEventListener("error", function (dbEvent) {
                _this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
                reject(dbEvent.target.error);
            });
        });
    };
    /**
     * Creates an internal tile url from the url template from IIndexedDbTileCacheOptions
     *
     * It keeps the sub-domain placeholder to provide unique database entries while seeding from multiple sub-domains.
     */
    IndexedDbTileCache.prototype.createInternalTileUrl = function (tileCoordinates) {
        return this.options.tileUrl
            .split(/{x}/)
            .join(tileCoordinates.x.toString())
            .split(/{y}/)
            .join(tileCoordinates.y.toString())
            .split(/{z}/)
            .join(tileCoordinates.z.toString());
    };
    /**
     * Creates a real tile url from the url template from IIndexedDbTileCacheOptions
     */
    IndexedDbTileCache.prototype.createTileUrl = function (tileCoordinates) {
        var randomSubDomain = this.options.tileUrlSubDomains[Math.floor(Math.random() * this.options.tileUrlSubDomains.length)];
        return this.createInternalTileUrl(tileCoordinates).split(/{s}/).join(randomSubDomain);
    };
    /**
     * Receive a tile as a Blob
     */
    IndexedDbTileCache.prototype.getTileAsBlob = function (tileCoordinates) {
        return this.getTileEntry(tileCoordinates, true).then(function (tileEntry) {
            return Promise.resolve(tileEntry.data);
        });
    };
    /**
     * Receives a tile as its base64 encoded data url.
     */
    IndexedDbTileCache.prototype.getTileAsDataUrl = function (tileCoordinates) {
        return __awaiter(this, void 0, void 0, function () {
            var blobAsDataUrl, tileEntry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blobAsDataUrl = function (blob) {
                            return new Promise(function (resolve, reject) {
                                var reader = new FileReader();
                                reader.onloadend = function () {
                                    resolve("" + reader.result);
                                };
                                reader.onerror = reject;
                                reader.readAsDataURL(blob);
                            });
                        };
                        return [4 /*yield*/, this.getTileEntry(tileCoordinates, true)];
                    case 1:
                        tileEntry = _a.sent();
                        return [2 /*return*/, blobAsDataUrl(tileEntry.data).then(function (dataUrl) { return Promise.resolve(dataUrl); })];
                }
            });
        });
    };
    /**
     * Download a specific tile by its coordinates and store it within the indexed-db
     */
    IndexedDbTileCache.prototype.downloadTile = function (tileCoordinates) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fetch(_this.createTileUrl(tileCoordinates)).then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                var contentType, dbRequest, tileCacheEntry, _a;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!response.ok) {
                                reject(new Error("Request failed with status " + response.statusText));
                            }
                            contentType = response.headers["content-type"];
                            dbRequest = indexedDB.open(this.options.databaseName, this.options.databaseVersion);
                            _a = {
                                contentType: contentType
                            };
                            return [4 /*yield*/, response.blob()];
                        case 1:
                            tileCacheEntry = (_a.data = _b.sent(),
                                _a.timestamp = Date.now(),
                                _a.url = this.createInternalTileUrl(tileCoordinates),
                                _a);
                            dbRequest.addEventListener("success", function (dbEvent) {
                                var database = dbEvent.target.result;
                                var tx = database
                                    .transaction([_this.options.objectStoreName], "readwrite")
                                    .objectStore(_this.options.objectStoreName)
                                    .put(tileCacheEntry);
                                tx.addEventListener("success", function () {
                                    resolve(tileCacheEntry);
                                });
                                tx.addEventListener("error", function (event) {
                                    _this.dispatchEvent(new CustomEvent("error", { detail: event.target.error }));
                                    reject(event.target.error);
                                });
                            });
                            dbRequest.addEventListener("error", function (dbEvent) {
                                _this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
                                reject(dbEvent.target.error);
                            });
                            return [2 /*return*/];
                    }
                });
            }); }, reject);
        });
    };
    /**
     * Seeds an area of tiles by the given bounding box, the maximal z value and the optional minimal z value.
     *
     * The returned number in the promise is equal to the duration of the operation in milliseconds.
     */
    IndexedDbTileCache.prototype.seedBBox = function (bbox, maxZ, minZ) {
        var _this = this;
        if (minZ === void 0) { minZ = 0; }
        var start = Date.now();
        var list = tile_utils_1.getListOfTilesInBBox(bbox, maxZ, minZ);
        var total = list.length;
        return new Promise(function (resolve, reject) {
            var fn = function () {
                /**
                 * @event IndexedDbTileCache#seed-progess
                 * @type IIndexedDbTileCacheSeedProgress
                 */
                _this.dispatchEvent(new CustomEvent("seed-progress", {
                    detail: { total: total, remains: list.length },
                }));
                var val = list.shift();
                if (val) {
                    _this.downloadTile(val).then(function () {
                        setTimeout(fn, _this.options.crawlDelay);
                    }, reject);
                    return;
                }
                resolve(Date.now() - start);
            };
            fn();
        });
    };
    /**
     * Purge the whole store
     */
    IndexedDbTileCache.prototype.purgeStore = function () {
        var _this = this;
        var dbRequest = indexedDB.open(this.options.databaseName, this.options.databaseVersion);
        return new Promise(function (resolve, reject) {
            dbRequest.addEventListener("success", function (dbEvent) {
                var database = dbEvent.target.result;
                var tx = database
                    .transaction([_this.options.objectStoreName], "readwrite")
                    .objectStore(_this.options.objectStoreName)
                    .clear();
                tx.addEventListener("success", function ( /* event: any */) {
                    resolve(true);
                });
                tx.addEventListener("error", function (event) {
                    _this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
                    reject(event.target.error);
                });
            });
            dbRequest.addEventListener("error", function (dbEvent) {
                _this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
            });
        });
    };
    return IndexedDbTileCache;
}(emitter_1.Emitter));
exports.IndexedDbTileCache = IndexedDbTileCache;
//# sourceMappingURL=indexed-db-tile-cache.js.map