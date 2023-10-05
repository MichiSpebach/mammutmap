"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingleShotSummarizer = void 0;
const prompts_1 = require("langchain/prompts");
const chains_1 = require("langchain/chains");
const summarizer_1 = require("./summarizer");
class SingleShotSummarizer extends summarizer_1.Summarizer {
    constructor(modelAndPrompt) {
        super();
        if (!modelAndPrompt.template) {
            modelAndPrompt.template = prompts_1.PromptTemplate.fromTemplate(`
            You are an expert software developer.
            What is the function of the following code in one sentence?
        
            {source}
            `);
        }
        this.chain = new chains_1.LLMChain({
            llm: modelAndPrompt.model,
            prompt: modelAndPrompt.template,
            verbose: true
        });
    }
    async summarize(input) {
        return this.chain.call({ source: input });
    }
    getType() {
        return "SingleShotSummarizer";
    }
}
exports.SingleShotSummarizer = SingleShotSummarizer;
