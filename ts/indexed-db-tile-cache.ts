import { getListOfTilesInBBox, IBBox, ITileCoordinates } from "@yaga/tile-utils";
import {
	DEFAULT_CRAWL_DELAY,
	DEFAULT_DATABASE_NAME,
	DEFAULT_DATABASE_VERSION,
	DEFAULT_MAX_AGE,
	DEFAULT_OBJECT_STORE_NAME,
	DEFAULT_TILE_URL,
	DEFAULT_TILE_URL_SUB_DOMAINS,
} from "./consts";
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
export class IndexedDbTileCache extends Emitter {
	constructor(public options: IIndexedDbTileCacheOptions = {}) {
		super();
		this.options.databaseName = this.options.databaseName || DEFAULT_DATABASE_NAME;
		this.options.databaseVersion = this.options.databaseVersion || DEFAULT_DATABASE_VERSION;
		this.options.objectStoreName = this.options.objectStoreName || DEFAULT_OBJECT_STORE_NAME;
		this.options.tileUrl = this.options.tileUrl || DEFAULT_TILE_URL;
		this.options.tileUrlSubDomains = this.options.tileUrlSubDomains || DEFAULT_TILE_URL_SUB_DOMAINS;
		this.options.crawlDelay = this.options.crawlDelay || DEFAULT_CRAWL_DELAY;
		this.options.maxAge = this.options.maxAge || DEFAULT_MAX_AGE;

		// Create the store if it does not exists...
		const dbRequest: IDBOpenDBRequest = indexedDB.open(this.options.databaseName, this.options.databaseVersion);
		dbRequest.addEventListener("upgradeneeded", (dbEvent: any) => {
			/**
			 * Fired event from IndexedDB to give the possibility to enhance something on the store
			 * @event IndexedDbTileCache#upgradeneeded
			 */
			this.dispatchEvent(
				new CustomEvent("upgradeneeded", {
					detail: dbEvent,
				})
			);
			const database: IDBDatabase = dbEvent.target.result;
			database.createObjectStore(this.options.objectStoreName, {
				keyPath: "url",
			});
		});
		dbRequest.addEventListener("error", (dbEvent: any) => {
			/**
			 * Piping the error event
			 * @event IndexedDbTileCache#upgradeneeded
			 */
			this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
		});
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
	public getTileEntry(
		tileCoordinates: ITileCoordinates,
		downloadIfUnavaiable?: boolean
	): Promise<IIndexedDbTileCacheEntry> {
		const dbRequest: IDBOpenDBRequest = indexedDB.open(this.options.databaseName, this.options.databaseVersion);

		return new Promise((resolve, reject) => {
			dbRequest.addEventListener("success", (dbEvent: any) => {
				const database: IDBDatabase = dbEvent.target.result;
				const tx = database
					.transaction([this.options.objectStoreName])
					.objectStore(this.options.objectStoreName)
					.get(this.createInternalTileUrl(tileCoordinates));

				tx.addEventListener("success", (event: any) => {
					if (!event.target.result) {
						if (downloadIfUnavaiable) {
							return this.downloadTile(tileCoordinates).then(resolve, reject);
						}
						return reject(new Error("Unable to find entry"));
					}
					const tileEntry: IIndexedDbTileCacheEntry = event.target.result as IIndexedDbTileCacheEntry;

					if (tileEntry.timestamp < Date.now() - this.options.maxAge) {
						// Too old
						return this.downloadTile(tileCoordinates)
							.catch(() => {
								// Not available so keep cached version...
								return resolve(tileEntry as IIndexedDbTileCacheEntry);
							})
							.then(resolve as (value: IIndexedDbTileCacheEntry) => void);
					}
					resolve(tileEntry);
				});
				tx.addEventListener("error", (event: any) => {
					this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
					reject(event.target.error);
				});
			});

			dbRequest.addEventListener("error", (dbEvent: any) => {
				this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
				reject(dbEvent.target.error);
			});
		});
	}

	/**
	 * Creates an internal tile url from the url template from IIndexedDbTileCacheOptions
	 *
	 * It keeps the sub-domain placeholder to provide unique database entries while seeding from multiple sub-domains.
	 */
	public createInternalTileUrl(tileCoordinates: ITileCoordinates): string {
		return this.options.tileUrl
			.split(/{x}/)
			.join(tileCoordinates.x.toString())
			.split(/{y}/)
			.join(tileCoordinates.y.toString())
			.split(/{z}/)
			.join(tileCoordinates.z.toString());
	}

	/**
	 * Creates a real tile url from the url template from IIndexedDbTileCacheOptions
	 */
	public createTileUrl(tileCoordinates: ITileCoordinates): string {
		const randomSubDomain: string = this.options.tileUrlSubDomains[
			Math.floor(Math.random() * this.options.tileUrlSubDomains.length)
		];

		return this.createInternalTileUrl(tileCoordinates).split(/{s}/).join(randomSubDomain);
	}

	/**
	 * Receive a tile as a Blob
	 */
	public getTileAsBlob(tileCoordinates: ITileCoordinates): Promise<Blob> {
		return this.getTileEntry(tileCoordinates, true).then((tileEntry: IIndexedDbTileCacheEntry) => {
			return Promise.resolve(tileEntry.data);
		});
	}

	/**
	 * Receives a tile as its base64 encoded data url.
	 */
	public async getTileAsDataUrl(tileCoordinates: ITileCoordinates): Promise<string> {
		const blobAsDataUrl = (blob): Promise<string> => {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					resolve("" + reader.result);
				};
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
		};
		const tileEntry: IIndexedDbTileCacheEntry = await this.getTileEntry(tileCoordinates, true);
		return blobAsDataUrl(tileEntry.data).then((dataUrl) => Promise.resolve(dataUrl));
	}

	/**
	 * Download a specific tile by its coordinates and store it within the indexed-db
	 */
	public downloadTile(tileCoordinates: ITileCoordinates): Promise<IIndexedDbTileCacheEntry> {
		return new Promise((resolve, reject) => {
			fetch(this.createTileUrl(tileCoordinates)).then(async (response) => {
				if (!response.ok) {
					reject(new Error(`Request failed with status ${response.statusText}`));
				}
				const contentType: string = response.headers["content-type"] as string;

				const dbRequest: IDBOpenDBRequest = indexedDB.open(this.options.databaseName, this.options.databaseVersion);

				const tileCacheEntry: IIndexedDbTileCacheEntry = {
					contentType,
					data: await response.blob(),
					timestamp: Date.now(),
					url: this.createInternalTileUrl(tileCoordinates),
				};

				dbRequest.addEventListener("success", (dbEvent: any) => {
					const database: IDBDatabase = dbEvent.target.result;
					const tx = database
						.transaction([this.options.objectStoreName], "readwrite")
						.objectStore(this.options.objectStoreName)
						.put(tileCacheEntry);

					tx.addEventListener("success", () => {
						resolve(tileCacheEntry);
					});
					tx.addEventListener("error", (event: any) => {
						this.dispatchEvent(new CustomEvent("error", { detail: event.target.error }));
						reject(event.target.error);
					});
				});

				dbRequest.addEventListener("error", (dbEvent: any) => {
					this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
					reject(dbEvent.target.error);
				});
			}, reject);
		});
	}

	/**
	 * Seeds an area of tiles by the given bounding box, the maximal z value and the optional minimal z value.
	 *
	 * The returned number in the promise is equal to the duration of the operation in milliseconds.
	 */
	public seedBBox(bbox: IBBox, maxZ: number, minZ: number = 0): Promise<number> {
		const start = Date.now();
		const list: ITileCoordinates[] = getListOfTilesInBBox(bbox, maxZ, minZ);
		const total: number = list.length;
		return new Promise((resolve, reject) => {
			const fn = () => {
				/**
				 * @event IndexedDbTileCache#seed-progess
				 * @type IIndexedDbTileCacheSeedProgress
				 */
				this.dispatchEvent(
					new CustomEvent("seed-progress", {
						detail: { total, remains: list.length },
					} as IIndexedDbTileCacheSeedProgress)
				);
				const val: ITileCoordinates = list.shift();
				if (val) {
					this.downloadTile(val).then(() => {
						setTimeout(fn, this.options.crawlDelay);
					}, reject);
					return;
				}
				resolve(Date.now() - start);
			};
			fn();
		});
	}

	/**
	 * Purge the whole store
	 */
	public purgeStore(): Promise<boolean> {
		const dbRequest: IDBOpenDBRequest = indexedDB.open(this.options.databaseName, this.options.databaseVersion);

		return new Promise((resolve, reject) => {
			dbRequest.addEventListener("success", (dbEvent: any) => {
				const database: IDBDatabase = dbEvent.target.result;
				const tx = database
					.transaction([this.options.objectStoreName], "readwrite")
					.objectStore(this.options.objectStoreName)
					.clear();

				tx.addEventListener("success", (/* event: any */) => {
					resolve(true);
				});
				tx.addEventListener("error", (event: any) => {
					this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
					reject(event.target.error);
				});
			});

			dbRequest.addEventListener("error", (dbEvent: any) => {
				this.dispatchEvent(new CustomEvent("error", { detail: dbEvent.target.error }));
			});
		});
	}
}
