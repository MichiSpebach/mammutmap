"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = exports.ConfigManagerInterface = void 0;
const pluginFacade_1 = require("../../dist/pluginFacade");
const result_1 = require("./util/result");
class ConfigManagerInterface {
}
exports.ConfigManagerInterface = ConfigManagerInterface;
class ConfigManager extends ConfigManagerInterface {
    async loadOrCreateConfig() {
        const apiKey = pluginFacade_1.applicationSettings.getRawField('openaiApiKey');
        if (apiKey) {
            return result_1.Result.of({ model: 'openai', apiKey: apiKey.toString() });
        }
        //TODO use popup to warn where the api key is saved
        const newApiKey = await pluginFacade_1.TextInputPopup.buildAndRenderAndAwaitResolve('Please enter a valid openai key', ''); //TODO get from popup
        pluginFacade_1.applicationSettings.setRawField('openaiApiKey', newApiKey);
        if (!newApiKey) {
            throw new Error('No openai key provided');
        }
        return result_1.Result.of({ model: 'openai', apiKey: newApiKey });
    }
}
exports.ConfigManager = ConfigManager;
