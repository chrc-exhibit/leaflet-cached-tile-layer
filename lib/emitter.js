"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable: max-line-length
var Emitter = /** @class */ (function () {
    function Emitter() {
        this.delegate = document.createDocumentFragment();
    }
    Emitter.prototype.addEventListener = function (type, listener, options) {
        return this.delegate.addEventListener(type, listener, options);
    };
    Emitter.prototype.dispatchEvent = function (event) {
        return this.delegate.dispatchEvent(event);
    };
    Emitter.prototype.removeEventListener = function (type, listener, options) {
        return this.delegate.removeEventListener(type, listener, options);
    };
    return Emitter;
}());
exports.Emitter = Emitter;
//# sourceMappingURL=emitter.js.map