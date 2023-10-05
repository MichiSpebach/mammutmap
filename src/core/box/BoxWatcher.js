"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxWatcher = void 0;
const BoxManager_1 = require("./BoxManager");
const util_1 = require("../util/util");
class BoxWatcher {
    static async newAndWatch(box) {
        const watcher = new BoxWatcher(box);
        await box.addWatcherAndUpdateRender(watcher);
        return watcher;
    }
    constructor(box) {
        this.box = box;
        this.boxId = box.getId();
        this.boxSrcPath = box.getSrcPath();
    }
    async get() {
        if (this.box) {
            return this.box;
        }
        let box = BoxManager_1.boxManager.getBoxIfExists(this.boxId);
        if (box) {
            this.box = box;
            box.addWatcherAndUpdateRender(this);
            return this.box;
        }
        // TODO:
        /*box = (await map?.getRootFolder().getBoxBySourcePathAndRenderIfNecessary(this.boxSrcPath, this))?.box
        if (box) {
          this.box = box
          return this.box
        }*/
        util_1.util.logError('failed to load box ' + this.boxSrcPath);
    }
    async unwatch() {
        if (!this.box) {
            util_1.util.logError('trying to unwatch unwatched box ' + this.boxSrcPath);
        }
        await this.box.removeWatcherAndUpdateRender(this);
        this.boxSrcPath = this.box.getSrcPath();
        this.box = null;
    }
}
exports.BoxWatcher = BoxWatcher;
