"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapReduceChainSummarizer = void 0;
const Summarizer_1 = require("./Summarizer");
const prompts_1 = require("langchain/prompts");
const chains_1 = require("langchain/chains");
const text_splitter_1 = require("langchain/text_splitter");
class MapReducerChain extends chains_1.BaseChain {
    constructor(llm, mapPromptTemplate, unifyPromptTemplate) {
        super();
        this.llm = llm;
        this.mapPromptTemplate = mapPromptTemplate;
        this.unifyPromptTemplate = unifyPromptTemplate;
        if (!this.unifyPromptTemplate) {
            this.unifyPromptTemplate = prompts_1.PromptTemplate.fromTemplate(`
                Combine and briefly summarize the following texts: ({summaries})
                `);
        }
    }
    async _call(values, runManager) {
        const input = values["input"];
        const chunks = await this.split_long_input(input);
        const chunkReplies = await this.mapInputChunks(chunks);
        const reduction = await this.reduceChunks(chunkReplies);
        return { ["text"]: reduction };
    }
    async split_long_input(input) {
        const splitter = new text_splitter_1.CharacterTextSplitter({ chunkSize: 3000, separator: "\n", chunkOverlap: 100 });
        return await splitter.splitText(input);
    }
    async mapInputChunks(chunks) {
        let chunkReplies = [];
        for (const chunk of chunks) {
            const prompt = await this.mapPromptTemplate.formatPromptValue({ input: chunk });
            const reply = await this.llm.call(prompt.value, {});
            chunkReplies = chunkReplies.concat([reply]);
        }
        return chunkReplies;
    }
    async reduceChunks(chunkOutputs) {
        const chunkCombination = chunkOutputs.reduce((a, b) => a + "\n" + b) + "\n";
        const prompt = await this.unifyPromptTemplate.formatPromptValue({ summaries: chunkCombination });
        return this.llm.call(prompt.value);
    }
    _chainType() {
        throw "Map Reducer Chain";
    }
    get inputKeys() {
        return ["input"];
    }
    get outputKeys() {
        return ["answer"];
    }
}
class MapReduceChainSummarizer extends Summarizer_1.Summarizer {
    constructor(modelAndPrompt) {
        super();
        const mapPrompt = prompts_1.PromptTemplate.fromTemplate(`You are an expert software developer.
                What is the function of the following code in one sentence?
                {input}`);
        const reducePrompt = prompts_1.PromptTemplate.fromTemplate(`You are an expert software developer
            The summaries between the brackets describe parts of a long code file. 
            Combine and briefly summarize them: ({summaries})
            `);
        this.chain = new MapReducerChain(modelAndPrompt.model, mapPrompt, reducePrompt);
    }
    async summarize(input) {
        return await this.chain.call({ input: input });
    }
}
exports.MapReduceChainSummarizer = MapReduceChainSummarizer;
