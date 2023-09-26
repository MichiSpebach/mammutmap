import { dialog } from "electron";
import { TextInputPopup, applicationSettings } from "../../dist/pluginFacade";
import { MapReduceChainSummarizer } from "./MapReduceChainSummarizer";
import { SingleShotSummarizer } from "./SingleShotSummarizer";
import { Summarizer } from "./Summarizer";
import { SummaryOpenAI } from "./SummaryOpenAI";
import { Result } from "./util/Result";

export class SummarizerFactory{
    private static lengthThreshold = 4000;
    public async getSummarizerFor(source: string):Promise<Result<Summarizer>>{
        const config = await this.loadOrCreateConfig();
        if(!config.isPresent()){
            return Result.empty(config.getError());
        }
        
        if (source.length > SummarizerFactory.lengthThreshold) {
            // TODO use popup from facade
            const doYouWantToProceed = await dialog.showMessageBox({
                message: "The file it to long to summarize it with one call to the llm. Should we try to summarize it with multiple calls?",
                type: "question", buttons: ["OK", "Cancel"]
            });
            if (!doYouWantToProceed) {
                return Result.empty("User canceled summarization");
            }
        }
        return Result.of(this.createSummarizer(source, config.get()));
    }

    private createSummarizer(source: string, config: { model: string, apiKey: string }): Summarizer {
        const llm = new SummaryOpenAI(config).getLLM();
        if (source.length > SummarizerFactory.lengthThreshold) {
            return new MapReduceChainSummarizer({ model: llm });
        }
        return new SingleShotSummarizer({ model: llm });
    }

    private async loadOrCreateConfig(): Promise<Result<{ model: string, apiKey: string }>> {
        const apiKey = applicationSettings.getRawField('openaiApiKey');
        if (apiKey) {
            return Result.of({ model: 'openai', apiKey: apiKey.toString() });
        }
    
        const newApiKey = await TextInputPopup.buildAndRenderAndAwaitResolve('Please enter a valid openai key', '');//TODO get from popup
        applicationSettings.setRawField('openaiApiKey', newApiKey);
        if (!newApiKey) {
            throw new Error('No openai key provided');
        }
        return Result.of({ model: 'openai', apiKey: newApiKey });
    }
    
}