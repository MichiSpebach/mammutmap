"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiSummaryLLMFactory = exports.SummaryOpenAI = void 0;
const summary_llm_1 = require("./summary-llm");
const openai_1 = require("langchain/llms/openai");
class SummaryOpenAI extends summary_llm_1.SummaryLLM {
    getLLM() {
        return this.llm;
    }
    constructor(config) {
        super();
        if (config.model != "openai") {
            throw new Error("This class is only for openai");
        }
        const key = config.apiKey;
        this.llm = new openai_1.OpenAI({ openAIApiKey: key, modelName: "gpt-3.5-turbo" });
    }
}
exports.SummaryOpenAI = SummaryOpenAI;
const openaiSummaryLLMFactory = (config) => {
    return new SummaryOpenAI(config);
};
exports.openaiSummaryLLMFactory = openaiSummaryLLMFactory;
