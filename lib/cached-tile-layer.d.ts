import { LatLngBounds, Map, TileLayer, TileLayerOptions } from "leaflet";
import { IIndexedDbTileCacheSeedProgress as ICachedTileLayerSeedProgress, IndexedDbTileCache } from "./indexed-db-tile-cache";
/**
 * Interface for the tile layer options. It is a mixin of the original Leaflet `TileLayerOptions` and the
 * `IndexedDbTileCacheOptions` of the YAGA Development Team.
 */
export interface ICachedTileLayerOptions extends TileLayerOptions {
    /**
     * Name of the database
     *
     * The default value is equal to the constance DEFAULT_DATABASE_NAME
     * @default "tile-cache-data"
     */
    databaseName?: string;
    /**
     * Version of the IndexedDB store. Should not be changed normally! But can provide an "upgradeneeded" event from
     * IndexedDB.
     *
     * The default value is equal to the constance DEFAULT_DATABASE_VERSION
     * @default 1
     */
    databaseVersion?: number;
    /**
     * Name of the object-store. Should correspond with the name of the tile server
     *
     * The default value is equal to the constance DEFAULT_OBJECT_STORE_NAME
     * @default "OSM";
     */
    objectStoreName?: string;
    /**
     * The delay in milliseconds used for not stressing the tile server while seeding.
     *
     * The default value is equal to the constance DEFAULT_CRAWL_DELAY
     * @default 500
     */
    crawlDelay?: number;
    /**
     * The maximum age in milliseconds of a stored tile.
     *
     * The default value is equal to the constance DEFAULT_MAX_AGE
     * @default 1000 * 60 * 60 * 24 * 7
     */
    maxAge?: number;
}
/**
 * Original Leaflet `TileLayer` enhanced with the `IndexedDbTileCache` of the YAGA Development Team.
 */
export declare class CachedTileLayer extends TileLayer {
    /**
     * Options of Leaflets `TileLayer`enhanced with the options for the `IndexedDbTileCache`.
     */
    options: ICachedTileLayerOptions;
    _map: Map;
    _globalTileRange: any;
    constructor(urlTemplate: string, options?: ICachedTileLayerOptions);
    /**
     * Rewritten method that serves the tiles from the `IndexedDbTileCache`
     */
    createTile(coords: any, done: any): HTMLElement;
    /**
     * Method that creates an instance of the `IndexedDbTileCache` from the options of this object.
     *
     * You can use this method to make advances operations on the tile cache.
     */
    instantiateIndexedDbTileCache(): IndexedDbTileCache;
    /**
     * Seed an area with a Leaflet `LatLngBound` and the given zoom range.
     *
     * The callback will be called before starting to download a tile and once after it is finished.
     *
     * The default value for `maxZoom` is the current zoom level of the map and the default value for `minZoom` is
     * always `0`.
     */
    seedBBox(bbox: LatLngBounds, maxZoom?: number, minZoom?: number, cb?: (progress: ICachedTileLayerSeedProgress) => void): Promise<number>;
    /**
     * Seeds like `this.seedBBox`, but uses the current map bounds as bounding box.
     */
    seedCurrentView(maxZoom?: number, minZoom?: number, cb?: (progress: ICachedTileLayerSeedProgress) => void): Promise<number>;
    /**
     * Clears the whole cache.
     */
    clearCache(): Promise<boolean>;
}
