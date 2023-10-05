import { dialog } from "electron";
import { MapReduceChainSummarizer } from "./summarizers/map-reduce-chain-summarizer";

import { Result } from "./util/result";
import { SingleShotSummarizer } from "./summarizers/single-shot-summarizer";
import { Summarizer } from "./summarizers/summarizer";
import { summaryLLMFactory } from "./llms/summary-llm";
import { ConfigManagerInterface } from "./config-manager";

export class SummarizerFactory{
    constructor(private summaryLLMFactory:summaryLLMFactory,private configManager:ConfigManagerInterface){ }

    private static lengthThreshold = 4000;
    public async getSummarizerFor(source: string):Promise<Result<Summarizer>>{
        const config = await this.configManager.loadOrCreateConfig();
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
        const llm = this.summaryLLMFactory(config).getLLM();
        if (source.length > SummarizerFactory.lengthThreshold) {
            return new MapReduceChainSummarizer({ model: llm });
        }
        return new SingleShotSummarizer({ model: llm });
    }
    
}