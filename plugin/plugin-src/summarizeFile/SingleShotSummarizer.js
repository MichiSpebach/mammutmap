"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingleShotSummarizer = void 0;
const prompts_1 = require("langchain/prompts");
const callbacks_1 = require("langchain/callbacks");
const chains_1 = require("langchain/chains");
const Summarizer_1 = require("./Summarizer");
class SingleShotSummarizer extends Summarizer_1.Summarizer {
    constructor(modelAndPrompt) {
        super();
        if (!modelAndPrompt.template) {
            modelAndPrompt.template = prompts_1.PromptTemplate.fromTemplate(`
            You are an expert software developer.
            What is the function of the following code in one sentence?
        
            {source}
            `);
        }
        const callbacks = new callbacks_1.ConsoleCallbackHandler();
        this.chain = new chains_1.LLMChain({
            llm: modelAndPrompt.model,
            prompt: modelAndPrompt.template,
            verbose: true,
            callbacks: [callbacks]
        });
    }
    async summarize(input) {
        return this.chain.call({ source: input });
    }
}
exports.SingleShotSummarizer = SingleShotSummarizer;
