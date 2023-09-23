"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryOpenAI = void 0;
const SummaryLLM_1 = require("./SummaryLLM");
const openai_1 = require("langchain/llms/openai");
const fs_1 = require("fs");
class SummaryOpenAI extends SummaryLLM_1.SummaryLLM {
    getLLM() {
        return this.llm;
    }
    constructor() {
        super();
        const key = (0, fs_1.readFileSync)("/home/thj/.openai/key.key", "utf-8");
        this.llm = new openai_1.OpenAI({ openAIApiKey: key, modelName: "gpt-3.5-turbo" });
    }
}
exports.SummaryOpenAI = SummaryOpenAI;
