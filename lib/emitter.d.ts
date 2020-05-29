export declare class Emitter {
    private delegate;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    dispatchEvent(event: Event | CustomEvent): boolean;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}
