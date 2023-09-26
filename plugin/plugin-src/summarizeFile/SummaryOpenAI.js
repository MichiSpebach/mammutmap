"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryOpenAI = void 0;
const SummaryLLM_1 = require("./SummaryLLM");
const openai_1 = require("langchain/llms/openai");
class SummaryOpenAI extends SummaryLLM_1.SummaryLLM {
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
