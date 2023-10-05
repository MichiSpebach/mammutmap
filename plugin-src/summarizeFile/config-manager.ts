import { TextInputPopup, applicationSettings } from "../../src/pluginFacade";
import { Result } from "./util/result";


export abstract class ConfigManagerInterface{
    abstract loadOrCreateConfig(): Promise<Result<{ model: string, apiKey: string }>>;
}

export class ConfigManager extends ConfigManagerInterface{
    async loadOrCreateConfig(): Promise<Result<{ model: string, apiKey: string }>> {
        const apiKey = applicationSettings.getRawField('openaiApiKey');
        if (apiKey) {
            return Result.of({ model: 'openai', apiKey: apiKey.toString() });
        }
    
        //TODO use popup to warn where the api key is saved
        const newApiKey = await TextInputPopup.buildAndRenderAndAwaitResolve('Please enter a valid openai key', '');//TODO get from popup
        applicationSettings.setRawField('openaiApiKey', newApiKey);
        if (!newApiKey) {
            throw new Error('No openai key provided');
        }
        return Result.of({ model: 'openai', apiKey: newApiKey });
    }
}