"use strict";
// tslint:disable: max-line-length trailing-comma
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
Object.defineProperty(exports, "__esModule", { value: true });
var leaflet_1 = require("leaflet");
var indexed_db_tile_cache_1 = require("./indexed-db-tile-cache");
/**
 * Original Leaflet `TileLayer` enhanced with the `IndexedDbTileCache` of the YAGA Development Team.
 */
var CachedTileLayer = /** @class */ (function (_super) {
    __extends(CachedTileLayer, _super);
    function CachedTileLayer(urlTemplate, options) {
        return _super.call(this, urlTemplate, options) || this;
    }
    /**
     * Rewritten method that serves the tiles from the `IndexedDbTileCache`
     */
    CachedTileLayer.prototype.createTile = function (coords, done) {
        var _this = this;
        // Rewrite of the original method...
        var tile = document.createElement("img");
        leaflet_1.DomEvent.on(tile, "load", leaflet_1.Util.bind(this._tileOnLoad, this, done, tile));
        leaflet_1.DomEvent.on(tile, "error", leaflet_1.Util.bind(this._tileOnError, this, done, tile));
        if (this.options.crossOrigin) {
            tile.crossOrigin = "";
        }
        /*
         Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
         http://www.w3.org/TR/WCAG20-TECHS/H67
         */
        tile.alt = "";
        /*
         Set role="presentation" to force screen readers to ignore this
         https://www.w3.org/TR/wai-aria/roles#textalternativecomputation
         */
        tile.setAttribute("role", "presentation");
        var tc = this.instantiateIndexedDbTileCache();
        tc.getTileAsDataUrl({
            x: coords.x,
            y: coords.y,
            z: this._getZoomForUrl(),
        })
            .then(function (dataUrl) {
            tile.src = dataUrl;
        })
            .catch(function () {
            tile.src = _this.options.errorTileUrl;
        });
        return tile;
    };
    /**
     * Method that creates an instance of the `IndexedDbTileCache` from the options of this object.
     *
     * You can use this method to make advances operations on the tile cache.
     */
    CachedTileLayer.prototype.instantiateIndexedDbTileCache = function () {
        return new indexed_db_tile_cache_1.IndexedDbTileCache({
            crawlDelay: this.options.crawlDelay,
            databaseName: this.options.databaseName,
            databaseVersion: this.options.databaseVersion,
            maxAge: this.options.maxAge,
            objectStoreName: this.options.objectStoreName,
            tileUrl: this._url,
            tileUrlSubDomains: this.options.subdomains,
        });
    };
    /**
     * Seed an area with a Leaflet `LatLngBound` and the given zoom range.
     *
     * The callback will be called before starting to download a tile and once after it is finished.
     *
     * The default value for `maxZoom` is the current zoom level of the map and the default value for `minZoom` is
     * always `0`.
     */
    CachedTileLayer.prototype.seedBBox = function (bbox, maxZoom, minZoom, cb) {
        if (minZoom === void 0) { minZoom = 0; }
        if (maxZoom === undefined) {
            maxZoom = this._map.getZoom();
        }
        var tc = this.instantiateIndexedDbTileCache();
        if (cb) {
            tc.addEventListener("seed-progress", cb);
        }
        return tc.seedBBox({
            maxLat: bbox.getNorth(),
            maxLng: bbox.getEast(),
            minLat: bbox.getSouth(),
            minLng: bbox.getWest(),
        }, maxZoom, minZoom);
    };
    /**
     * Seeds like `this.seedBBox`, but uses the current map bounds as bounding box.
     */
    CachedTileLayer.prototype.seedCurrentView = function (maxZoom, minZoom, cb) {
        if (minZoom === void 0) { minZoom = 0; }
        return this.seedBBox(this._map.getBounds(), maxZoom, minZoom, cb);
    };
    /**
     * Clears the whole cache.
     */
    CachedTileLayer.prototype.clearCache = function () {
        var tc = this.instantiateIndexedDbTileCache();
        return tc.purgeStore();
    };
    return CachedTileLayer;
}(leaflet_1.TileLayer));
exports.CachedTileLayer = CachedTileLayer;
//# sourceMappingURL=cached-tile-layer.js.map