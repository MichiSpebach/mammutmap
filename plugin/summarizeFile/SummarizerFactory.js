"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummarizerFactory = void 0;
const electron_1 = require("electron");
const pluginFacade_1 = require("../../dist/pluginFacade");
const MapReduceChainSummarizer_1 = require("./MapReduceChainSummarizer");
const SingleShotSummarizer_1 = require("./SingleShotSummarizer");
const SummaryOpenAI_1 = require("./SummaryOpenAI");
const Result_1 = require("./util/Result");
class SummarizerFactory {
    async getSummarizerFor(source) {
        const config = await this.loadOrCreateConfig();
        if (!config.isPresent()) {
            return Result_1.Result.empty(config.getError());
        }
        if (source.length > SummarizerFactory.lengthThreshold) {
            // TODO use popup from facade
            const doYouWantToProceed = await electron_1.dialog.showMessageBox({
                message: "The file it to long to summarize it with one call to the llm. Should we try to summarize it with multiple calls?",
                type: "question", buttons: ["OK", "Cancel"]
            });
            if (!doYouWantToProceed) {
                return Result_1.Result.empty("User canceled summarization");
            }
        }
        return Result_1.Result.of(this.createSummarizer(source, config.get()));
    }
    createSummarizer(source, config) {
        const llm = new SummaryOpenAI_1.SummaryOpenAI(config).getLLM();
        if (source.length > SummarizerFactory.lengthThreshold) {
            return new MapReduceChainSummarizer_1.MapReduceChainSummarizer({ model: llm });
        }
        return new SingleShotSummarizer_1.SingleShotSummarizer({ model: llm });
    }
    async loadOrCreateConfig() {
        const apiKey = pluginFacade_1.applicationSettings.getRawField('openaiApiKey');
        if (apiKey) {
            return Result_1.Result.of({ model: 'openai', apiKey: apiKey.toString() });
        }
        const newApiKey = await pluginFacade_1.TextInputPopup.buildAndRenderAndAwaitResolve('Please enter a valid openai key', ''); //TODO get from popup
        pluginFacade_1.applicationSettings.setRawField('openaiApiKey', newApiKey);
        if (!newApiKey) {
            throw new Error('No openai key provided');
        }
        return Result_1.Result.of({ model: 'openai', apiKey: newApiKey });
    }
}
exports.SummarizerFactory = SummarizerFactory;
SummarizerFactory.lengthThreshold = 4000;
