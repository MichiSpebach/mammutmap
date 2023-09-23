"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapReduceSummarizer = void 0;
const Summarizer_1 = require("./Summarizer");
const prompts_1 = require("langchain/prompts");
const chains_1 = require("langchain/chains");
const text_splitter_1 = require("langchain/text_splitter");
class MapReduceSummarizer extends Summarizer_1.Summarizer {
    constructor(modelAndPrompt) {
        super();
        const prompt = prompts_1.PromptTemplate.fromTemplate(`You are an expert software developer.
                What is the function of the following code in one sentence?
                {source}`);
        const combinePrompt = prompts_1.PromptTemplate.fromTemplate(`You are an expert software developer
            The summaries between the brackets describe parts of a long code file. 
            Combine and briefly summarize them: ({summaries})
            `);
        this.mapChain = new chains_1.LLMChain({ llm: modelAndPrompt.model, prompt: prompt });
        this.combineChain = new chains_1.LLMChain({ llm: modelAndPrompt.model, prompt: combinePrompt });
        // TODO use proper langchain function MapReduce Chain?
    }
    async summarize(input) {
        const splitter = new text_splitter_1.CharacterTextSplitter({ chunkSize: 3000, separator: "\n", chunkOverlap: 100 });
        const chunks = await splitter.splitText(input);
        let summaryChunks = "";
        for (const chunk in chunks) {
            const summary = await this.mapChain.call({ source: chunks[0] });
            //console.log(summary["text"]);
            summaryChunks = summaryChunks + summary.text + "\n";
        }
        return await this.combineChain.call({ summaries: summaryChunks });
    }
}
exports.MapReduceSummarizer = MapReduceSummarizer;
