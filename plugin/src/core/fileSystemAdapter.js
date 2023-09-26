"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemAdapter = exports.init = exports.fileSystem = exports.DirentBasicImpl = exports.UnknownDirentKindStatsBasicImpl = exports.DirectoryStatsBasicImpl = exports.FileStatsBasicImpl = void 0;
const util_1 = require("./util/util");
class FileStatsBasicImpl {
    constructor(sizeInBytes) {
        this.size = sizeInBytes;
    }
    isFile() {
        return true;
    }
}
exports.FileStatsBasicImpl = FileStatsBasicImpl;
class DirectoryStatsBasicImpl {
    constructor() {
        this.size = 0;
    }
    isFile() {
        return false;
    }
}
exports.DirectoryStatsBasicImpl = DirectoryStatsBasicImpl;
class UnknownDirentKindStatsBasicImpl {
    constructor(kind) {
        this.size = 0;
        this.kind = kind;
    }
    isFile() {
        return false;
    }
}
exports.UnknownDirentKindStatsBasicImpl = UnknownDirentKindStatsBasicImpl;
class DirentBasicImpl {
    constructor(name, kind) {
        this.name = name;
        this.kind = kind;
    }
    isFile() {
        return this.kind === 'file';
    }
    isDirectory() {
        return this.kind === 'directory';
    }
}
exports.DirentBasicImpl = DirentBasicImpl;
function init(object) {
    exports.fileSystem = object;
}
exports.init = init;
/**
 * TODO: some methods don't fit here, introduce fileSystemTools|fileSystemJsonTools|fileSystemDataLayer|fileSystemObjectLayer that calls this adapter
 * and move loadFromJsonFile(..), saveToJsonFile(..), mergeObjectIntoJsonFile(..), readFileAndConvertToHtml(..) there
 * then change FileSystemAdapter from class to interface
 */
class FileSystemAdapter {
    constructor() {
        this.ongoingOperations = [];
    }
    /** on some operating systems files can get corrupted when accessed concurrently */
    // TODO: use this for all file operations
    async scheduleOperation(pathToWaitFor, action) {
        const ongoing = this.ongoingOperations.find(ongoing => ongoing.path === pathToWaitFor);
        if (ongoing) {
            await ongoing.promise;
            return this.scheduleOperation(pathToWaitFor, action);
        }
        const promise = action();
        this.ongoingOperations.push({ path: pathToWaitFor, promise });
        await promise;
        this.ongoingOperations.splice(this.ongoingOperations.findIndex(finished => finished.promise === promise), 1);
        return promise;
    }
    async loadFromJsonFile(filePath, buildFromJson) {
        return this.readFile(filePath)
            .then(json => {
            return buildFromJson(json);
        })
            .catch(_ => {
            return null;
        });
    }
    async saveToJsonFile(filePath, object, options) {
        if (await this.doesDirentExist(filePath)) {
            await this.mergeObjectIntoJsonFile(filePath, object, options);
        }
        else {
            await this.writeFile(filePath, object.toJson(), options);
        }
    }
    async mergeObjectIntoJsonFile(path, object, options) {
        await this.scheduleOperation(path, async () => {
            const originalJson = await this.readFile(path);
            const mergedJson = object.mergeIntoJson(originalJson);
            await this.writeFile(path, mergedJson, options);
        });
    }
    async readFileAndConvertToHtml(path) {
        return util_1.util.escapeForHtml(await this.readFile(path));
    }
}
exports.FileSystemAdapter = FileSystemAdapter;
