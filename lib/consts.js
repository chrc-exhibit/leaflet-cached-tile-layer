"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The default database name
 */
exports.DEFAULT_DATABASE_NAME = "tile-cache-data";
/**
 * The default object store name of the database
 */
exports.DEFAULT_OBJECT_STORE_NAME = "OSM";
/**
 * The default tile url (the one from OpenStreetMap)
 */
exports.DEFAULT_TILE_URL = "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
/**
 * The default sub domains
 */
exports.DEFAULT_TILE_URL_SUB_DOMAINS = ["a", "b", "c"];
/**
 * The fallback version of your IndexedDB database
 */
exports.DEFAULT_DATABASE_VERSION = 1;
/**
 * The default delay between downloads during the seeding process
 */
exports.DEFAULT_CRAWL_DELAY = 500;
/**
 * The default maximum age of a cached tile (equals one week)
 */
exports.DEFAULT_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // one week
//# sourceMappingURL=consts.js.map