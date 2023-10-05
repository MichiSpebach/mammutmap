"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
class Result {
    static of(value) {
        return new Result({ value: value, error: '', isPresent: true });
    }
    static empty(error) {
        return new Result({ isPresent: false, error: error, value: null });
    }
    constructor(value) {
        this.value = value;
    }
    get() {
        if (!this.isPresent()) {
            throw new Error("Optional is empty");
        }
        return this.value.value;
    }
    getError() {
        return this.value.error;
    }
    isPresent() {
        return this.value.isPresent;
    }
    map(f) {
        if (this.isPresent()) {
            return new Result({ value: f(this.value.value), isPresent: true, error: '' });
        }
        return new Result({ value: null, isPresent: false, error: this.value.error });
    }
}
exports.Result = Result;
