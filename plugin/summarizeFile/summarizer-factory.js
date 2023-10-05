"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummarizerFactory = void 0;
const electron_1 = require("electron");
const map_reduce_chain_summarizer_1 = require("./summarizers/map-reduce-chain-summarizer");
const result_1 = require("./util/result");
const single_shot_summarizer_1 = require("./summarizers/single-shot-summarizer");
class SummarizerFactory {
    constructor(summaryLLMFactory, configManager) {
        this.summaryLLMFactory = summaryLLMFactory;
        this.configManager = configManager;
    }
    async getSummarizerFor(source) {
        const config = await this.configManager.loadOrCreateConfig();
        if (!config.isPresent()) {
            return result_1.Result.empty(config.getError());
        }
        if (source.length > SummarizerFactory.lengthThreshold) {
            // TODO use popup from facade
            const doYouWantToProceed = await electron_1.dialog.showMessageBox({
                message: "The file it to long to summarize it with one call to the llm. Should we try to summarize it with multiple calls?",
                type: "question", buttons: ["OK", "Cancel"]
            });
            if (!doYouWantToProceed) {
                return result_1.Result.empty("User canceled summarization");
            }
        }
        return result_1.Result.of(this.createSummarizer(source, config.get()));
    }
    createSummarizer(source, config) {
        const llm = this.summaryLLMFactory(config).getLLM();
        if (source.length > SummarizerFactory.lengthThreshold) {
            return new map_reduce_chain_summarizer_1.MapReduceChainSummarizer({ model: llm });
        }
        return new single_shot_summarizer_1.SingleShotSummarizer({ model: llm });
    }
}
exports.SummarizerFactory = SummarizerFactory;
SummarizerFactory.lengthThreshold = 4000;
