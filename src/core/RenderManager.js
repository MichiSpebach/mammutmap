"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.renderManager = exports.SchedulablePromise = exports.Command = exports.RenderPriority = exports.RenderManager = void 0;
const domAdapter_1 = require("./domAdapter");
const ClientPosition_1 = require("./shape/ClientPosition");
class RenderManager {
    constructor() {
        this.commands = [];
    }
    isReady() {
        return !!domAdapter_1.dom;
    }
    getPendingCommandsCount() {
        return this.commands.length;
    }
    openDevTools() {
        domAdapter_1.dom.openDevTools();
    }
    openWebLink(webLink) {
        domAdapter_1.dom.openWebLink(webLink);
    }
    getClientSize() {
        return domAdapter_1.dom.getClientSize();
    }
    getCursorClientPosition() {
        const position = domAdapter_1.dom.getCursorClientPosition();
        return new ClientPosition_1.ClientPosition(position.x, position.y);
    }
    isElementHovered(id) {
        return domAdapter_1.dom.isElementHovered(id);
    }
    getClientRectOf(id, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            squashableWith: 'getClientRectOf' + id,
            command: () => domAdapter_1.dom.getClientRectOf(id)
        }));
    }
    getValueOf(id, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            squashableWith: 'getValueOf' + id,
            command: () => domAdapter_1.dom.getValueOf(id)
        }));
    }
    setValueTo(id, value, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            squashableWith: 'setValueTo' + id,
            command: () => domAdapter_1.dom.setValueTo(id, value)
        }));
    }
    appendChildTo(parentId, childId, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            squashableWith: 'appendChildTo' + childId,
            batchParameters: { elementId: parentId, method: 'appendChildTo', value: childId },
            command: () => domAdapter_1.dom.appendChildTo(parentId, childId)
        }));
    }
    addContentTo(id, content, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            // updatableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
            batchParameters: { elementId: id, method: 'addContentTo', value: content },
            command: () => domAdapter_1.dom.addContentTo(id, content)
        }));
    }
    addElementsTo(id, elements, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            // updatableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
            batchParameters: { elementId: id, method: 'addElementsTo', value: elements },
            command: () => domAdapter_1.dom.addElementsTo(id, elements)
        }));
    }
    addElementTo(id, element, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            // updatableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
            batchParameters: { elementId: id, method: 'addElementTo', value: element },
            command: () => domAdapter_1.dom.addElementTo(id, element)
        }));
    }
    setElementsTo(id, elements, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            // squashableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
            batchParameters: { elementId: id, method: 'setElementsTo', value: elements },
            command: () => domAdapter_1.dom.setElementsTo(id, elements)
        }));
    }
    setElementTo(id, element, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            // squashableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
            batchParameters: { elementId: id, method: 'setElementTo', value: element },
            command: () => domAdapter_1.dom.setElementTo(id, element)
        }));
    }
    setContentTo(id, content, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            // squashableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
            batchParameters: { elementId: id, method: 'innerHTML', value: content },
            command: () => domAdapter_1.dom.setContentTo(id, content)
        }));
    }
    clearContentOf(id, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            // squashableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
            batchParameters: { elementId: id, method: 'innerHTML', value: '' },
            command: () => domAdapter_1.dom.clearContentOf(id)
        }));
    }
    remove(id, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            command: () => domAdapter_1.dom.remove(id)
        }));
    }
    setStyleTo(id, style, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            squashableWith: 'setStyleTo' + id,
            batchParameters: { elementId: id, method: 'style', value: style },
            command: () => domAdapter_1.dom.setStyleTo(id, style)
        }));
    }
    addClassTo(id, className, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            squashableWith: 'addClass' + className + 'to' + id,
            updatableWith: 'removeClass' + className + 'from' + id,
            batchParameters: { elementId: id, method: 'addClassTo', value: className },
            command: () => domAdapter_1.dom.addClassTo(id, className)
        }));
    }
    removeClassFrom(id, className, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            squashableWith: 'removeClass' + className + 'from' + id,
            updatableWith: 'addClass' + className + 'to' + id,
            batchParameters: { elementId: id, method: 'removeClassFrom', value: className },
            command: () => domAdapter_1.dom.removeClassFrom(id, className)
        }));
    }
    scrollToBottom(id, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            command: () => domAdapter_1.dom.scrollToBottom(id)
        }));
    }
    addKeydownListenerTo(id, key, callback, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            command: () => domAdapter_1.dom.addKeydownListenerTo(id, key, callback)
        }));
    }
    addChangeListenerTo(id, returnField, callback, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            command: () => domAdapter_1.dom.addChangeListenerTo(id, returnField, callback)
        }));
    }
    addWheelListenerTo(id, callback, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            command: () => domAdapter_1.dom.addWheelListenerTo(id, callback)
        }));
    }
    addEventListenerAdvancedTo(id, eventType, { priority = RenderPriority.NORMAL, stopPropagation, capture }, callback) {
        return this.runOrSchedule(new Command({
            priority: priority,
            command: () => domAdapter_1.dom.addEventListenerAdvancedTo(id, eventType, { stopPropagation, capture }, callback)
        }));
    }
    addEventListenerTo(id, eventType, callback, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            command: () => domAdapter_1.dom.addEventListenerTo(id, eventType, callback)
        }));
    }
    async addDragListenerTo(id, eventType, callback, priority = RenderPriority.NORMAL) {
        return this.runOrSchedule(new Command({
            priority: priority,
            command: () => domAdapter_1.dom.addDragListenerTo(id, eventType, callback)
        }));
    }
    removeEventListenerFrom(id, eventType, options) {
        return this.runOrSchedule(new Command({
            priority: options?.priority ?? RenderPriority.NORMAL,
            command: () => domAdapter_1.dom.removeEventListenerFrom(id, eventType, options?.listenerCallback)
        }));
    }
    async runOrSchedule(command) {
        const updatedCommand = this.tryToUpdateQueuedCommands(command);
        if (updatedCommand) {
            return updatedCommand.promise.get();
        }
        const squashedCommand = this.tryToSquashIntoQueuedCommands(command);
        if (squashedCommand) {
            return squashedCommand.promise.get();
        }
        this.addCommand(command);
        const commandCanBeStarted = this.blockUntilCommandCanBeStarted(command);
        if (commandCanBeStarted instanceof Promise) {
            await commandCanBeStarted;
        }
        else {
            var minPriority = commandCanBeStarted.minPriority;
        }
        if (!command.promise.isStarted()) { // if command was batched into another command, promise is already started
            // TODO: is always true with current implementation becuase command was modified by command it was batched into to directly resolve, change implementation or remove condition
            this.batchUpcommingCommandsInto(command, minPriority);
            command.promise.run();
        }
        command.promise.get().then(() => this.commands.splice(this.commands.indexOf(command), 1)); // TODO: check that no race conditions occur, improve
        return command.promise.get();
    }
    addCommand(command) {
        let i = 0;
        for (; i < this.commands.length; i++) {
            const queuedCommand = this.commands[i];
            if (command.priority > queuedCommand.priority && !queuedCommand.promise.isStarted()) {
                break;
            }
        }
        this.commands.splice(i, 0, command);
    }
    blockUntilCommandCanBeStarted(command) {
        const maxStartedCommandsCount = 3;
        const indexToWaitFor = this.commands.indexOf(command) - 1;
        if (indexToWaitFor >= 0) {
            if (command.priority >= RenderPriority.RESPONSIVE) {
                const startedCommandsCount = this.commands.filter(command => command.promise.isStarted()).length;
                if (startedCommandsCount < maxStartedCommandsCount) {
                    return { minPriority: RenderPriority.RESPONSIVE };
                }
            }
            return this.commands[indexToWaitFor].promise.get();
        }
        return {};
    }
    // TODO: remove and simply use tryToUpdateQueuedCommands(..)
    tryToSquashIntoQueuedCommands(command) {
        if (!command.squashableWith) {
            return undefined;
        }
        for (let i = 0; i < this.commands.length; i++) {
            const compareCommand = this.commands[i];
            if (compareCommand.promise.isStarted()) {
                continue;
            }
            if (compareCommand.squashableWith == command.squashableWith) {
                compareCommand.batchParameters = command.batchParameters;
                compareCommand.promise.setCommand(command.promise.getCommand());
                this.increasePriorityOfCommandIfNecessary(compareCommand, command.priority);
                return compareCommand;
            }
        }
        return undefined;
    }
    tryToUpdateQueuedCommands(command) {
        if (!command.updatableWith) {
            return undefined;
        }
        for (let i = 0; i < this.commands.length; i++) {
            const compareCommand = this.commands[i];
            if (compareCommand.promise.isStarted()) {
                continue;
            }
            if (compareCommand.updatableWith == command.squashableWith) {
                compareCommand.updatableWith = command.updatableWith;
                compareCommand.squashableWith = command.squashableWith;
                compareCommand.batchParameters = command.batchParameters;
                compareCommand.promise.setCommand(command.promise.getCommand());
                this.increasePriorityOfCommandIfNecessary(compareCommand, command.priority);
                return compareCommand;
            }
        }
        return undefined;
    }
    increasePriorityOfCommandIfNecessary(command, newPriority) {
        if (newPriority <= command.priority.valueOf()) {
            return;
        }
        command.priority = newPriority;
        const indexOfCommand = this.commands.indexOf(command);
        if (indexOfCommand === -1) {
            throw Error('trying to resort command that is not contained in commands, this should never happen');
        }
        for (let i = 0; i < indexOfCommand && this.commands.length; i++) {
            if (command.priority > this.commands[i].priority) {
                this.commands.splice(this.commands.indexOf(command), 1);
                this.commands.splice(i, 0, command);
                return;
            }
        }
    }
    batchUpcommingCommandsInto(command, minPriority) {
        if (!command.batchParameters) {
            return;
        }
        const maxBatchSize = 100;
        const batch = [];
        let originalCommandAdded = false;
        for (let i = 0; i < this.commands.length && batch.length < maxBatchSize; i++) {
            const upcommingCommand = this.commands[i];
            if (upcommingCommand.batchParameters) {
                if (upcommingCommand.promise.isStarted() || (minPriority && command.priority < minPriority)) {
                    continue;
                }
                batch.push(upcommingCommand.batchParameters);
                upcommingCommand.squashableWith = undefined;
                upcommingCommand.updatableWith = undefined;
                upcommingCommand.batchParameters = undefined;
                if (upcommingCommand !== command) {
                    upcommingCommand.promise.setCommand(() => Promise.resolve());
                }
                else {
                    originalCommandAdded = true;
                }
            }
        }
        if (!originalCommandAdded) { // prevents original command from being squeezed out if there are a lot of higher prioritized commands
            batch.push(command.batchParameters);
        }
        if (batch.length > 1) {
            command.promise.setCommand(() => domAdapter_1.dom.batch(batch));
        }
    }
    getCommands() {
        return this.commands;
    }
}
exports.RenderManager = RenderManager;
var RenderPriority;
(function (RenderPriority) {
    RenderPriority[RenderPriority["NORMAL"] = 1] = "NORMAL";
    RenderPriority[RenderPriority["RESPONSIVE"] = 2] = "RESPONSIVE";
})(RenderPriority || (exports.RenderPriority = RenderPriority = {}));
class Command {
    constructor(options) {
        this.priority = options.priority;
        this.squashableWith = options.squashableWith;
        this.updatableWith = options.updatableWith;
        this.batchParameters = options.batchParameters;
        this.promise = new SchedulablePromise(options.command);
    }
}
exports.Command = Command;
class SchedulablePromise {
    constructor(command) {
        this.started = false;
        this.promise = new Promise((resolve) => {
            this.resolve = resolve;
        });
        this.command = command;
    }
    get() {
        return this.promise;
    }
    run() {
        this.started = true;
        const result = this.command();
        if (!this.resolve) {
            throw Error('resolve function is still undefined, this should be impossible at this state');
        }
        this.resolve(result);
    }
    getCommand() {
        return this.command;
    }
    setCommand(command) {
        this.command = command;
    }
    isStarted() {
        return this.started;
    }
}
exports.SchedulablePromise = SchedulablePromise;
exports.renderManager = new RenderManager();
function init(object) {
    exports.renderManager = object;
}
exports.init = init;
