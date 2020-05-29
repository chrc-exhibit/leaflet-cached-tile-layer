// tslint:disable: max-line-length
export class Emitter {
    private delegate: DocumentFragment = document.createDocumentFragment();

    public addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
        return this.delegate.addEventListener(type, listener, options);
    }

    public dispatchEvent(event: Event | CustomEvent): boolean {
        return this.delegate.dispatchEvent(event);
    }

    public removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
        return this.delegate.removeEventListener(type, listener, options);
    }
}
