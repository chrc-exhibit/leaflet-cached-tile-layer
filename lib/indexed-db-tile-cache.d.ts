import { IBBox, ITileCoordinates } from "@yaga/tile-utils";
import { Emitter } from "./emitter";
/**
 * Interface for the options parameter of the constructor of the IndexedDbTileCache class
 */
export interface IIndexedDbTileCacheOptions {
    /**
     * Name of the database
     *
     * The default value is equal to the constant DEFAULT_DATABASE_NAME
     * @default "tile-cache-data"
     */
    databaseName?: string;
    /**
     * Version of the IndexedDB store. Should not be changed normally! But can provide an "upgradeneeded" event from
     * IndexedDB.
     *
     * The default value is equal to the constant DEFAULT_DATABASE_VERSION
     * @default 1
     */
    databaseVersion?: number;
    /**
     * Name of the object-store. Should correspond with the name of the tile server
     *
     * The default value is equal to the constant DEFAULT_OBJECT_STORE_NAME
     * @default "OSM";
     */
    objectStoreName?: string;
    /**
     * URL template of the tile server.
     *
     * The default value is equal to the constant DEFAULT_TILE_URL
     * @default "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
     */
    tileUrl?: string;
    /**
     * A list of all available sub domains for the URL template.
     *
     * The default value is equal to the constant DEFAULT_TILE_URL_SUB_DOMAINS
     * @default ["a", "b", "c"]
     */
    tileUrlSubDomains?: string[];
    /**
     * The delay in milliseconds used for not stressing the tile server while seeding.
     *
     * The default value is equal to the constant DEFAULT_CRAWL_DELAY
     * @default 500
     */
    crawlDelay?: number;
    /**
     * The maximum age in milliseconds of a stored tile.
     *
     * The default value is equal to the constant DEFAULT_MAX_AGE
     * @default 1000 * 60 * 60 * 24 * 7
     */
    maxAge?: number;
}
/**
 * Interface for an internal IndexedDbTileCacheEntry
 */
export interface IIndexedDbTileCacheEntry {
    /** URL of the tile excepts its sub-domain value that is still stored as placeholder. */
    url: string;
    /** Timestamp of the creation date of the entry */
    timestamp: number;
    /** Data stored as blob */
    data: Blob;
    /** The content-type from the response header. */
    contentType: string;
}
/**
 * Interface for the "seed-progress" event
 */
export interface IIndexedDbTileCacheSeedProgress extends CustomEvent {
    detail: {
        total: number;
        remains: number;
    };
}
/**
 * Class for a spatial-tile-cache that stores its data in the browsers IndexedDB
 */
export declare class IndexedDbTileCache extends Emitter {
    options: IIndexedDbTileCacheOptions;
    constructor(options?: IIndexedDbTileCacheOptions);
    /**
     * Get the internal tile entry from the database with all its additional meta information.
     *
     * If the tile is marked as outdated by the `IIndexedDbTileCacheOptions.maxAge` property, it tries to download it
     * again. On any error it will provide the cached version.
     *
     * If you pass `true` as parameter for the `downloadIfUnavaiable` argument, it tries to dowenload a tile if it is
     * not stored already.
     */
    getTileEntry(tileCoordinates: ITileCoordinates, downloadIfUnavaiable?: boolean): Promise<IIndexedDbTileCacheEntry>;
    /**
     * Creates an internal tile url from the url template from IIndexedDbTileCacheOptions
     *
     * It keeps the sub-domain placeholder to provide unique database entries while seeding from multiple sub-domains.
     */
    createInternalTileUrl(tileCoordinates: ITileCoordinates): string;
    /**
     * Creates a real tile url from the url template from IIndexedDbTileCacheOptions
     */
    createTileUrl(tileCoordinates: ITileCoordinates): string;
    /**
     * Receive a tile as a Blob
     */
    getTileAsBlob(tileCoordinates: ITileCoordinates): Promise<Blob>;
    /**
     * Receives a tile as its base64 encoded data url.
     */
    getTileAsDataUrl(tileCoordinates: ITileCoordinates): Promise<string>;
    /**
     * Download a specific tile by its coordinates and store it within the indexed-db
     */
    downloadTile(tileCoordinates: ITileCoordinates): Promise<IIndexedDbTileCacheEntry>;
    /**
     * Seeds an area of tiles by the given bounding box, the maximal z value and the optional minimal z value.
     *
     * The returned number in the promise is equal to the duration of the operation in milliseconds.
     */
    seedBBox(bbox: IBBox, maxZ: number, minZ?: number): Promise<number>;
    /**
     * Purge the whole store
     */
    purgeStore(): Promise<boolean>;
}
