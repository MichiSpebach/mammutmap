import { Summarizer } from "./summarizer";
import { BaseLLM, LLM } from "langchain/dist/llms/base";
import { PromptTemplate } from "langchain/prompts";
import { BaseChain, LLMChain } from "langchain/chains";
import { ChainValues } from "langchain/dist/schema";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { CallbackManagerForChainRun } from "langchain/callbacks";

class MapReducerChain extends BaseChain {

    constructor(private llm: BaseLLM, private mapPromptTemplate: PromptTemplate, private unifyPromptTemplate: PromptTemplate | null) {
        super();
        if (!this.unifyPromptTemplate) {
            this.unifyPromptTemplate = PromptTemplate.fromTemplate(
                `
                Combine and briefly summarize the following texts: ({summaries})
                `
            );
        }
    }

    override async _call(values: ChainValues, runManager?: CallbackManagerForChainRun | undefined): Promise<ChainValues> {
        const input = values["input"];
        const chunks = await this.split_long_input(input);
        const chunkReplies = await this.mapInputChunks(chunks);
        const reduction = await this.reduceChunks(chunkReplies);

        return {["text"]:reduction};
    }

    private async split_long_input(input: string) {
        const splitter = new CharacterTextSplitter({ chunkSize: 3000, separator: "\n", chunkOverlap: 100 });
        return await splitter.splitText(input);
    }

    private async mapInputChunks(chunks: string[]) {
        let chunkReplies: string[] = [];
        for (const chunk of chunks) {
            const prompt = await this.mapPromptTemplate.formatPromptValue({ input: chunk });
          
            const reply = await this.llm.call(prompt.value, {});
            chunkReplies = chunkReplies.concat([reply]);
        }
        return chunkReplies;
    }

    private async reduceChunks(chunkOutputs: string[]) {
        const chunkCombination = chunkOutputs.reduce((a, b) => a + "\n" + b) + "\n";

        const prompt = await this.unifyPromptTemplate!.formatPromptValue({ summaries: chunkCombination });
        return this.llm.call(prompt.value)

    }
    override _chainType(): string {
        throw "Map Reducer Chain"
    }
    override get inputKeys(): string[] {
        return ["input"];
    }
    override get outputKeys(): string[] {
        return ["answer"];
    }


}


export class MapReduceChainSummarizer extends Summarizer {

    private chain: MapReducerChain;

    constructor(modelAndPrompt: { model: BaseLLM, prompt?: PromptTemplate }) {
        super();
        const mapPrompt = PromptTemplate.fromTemplate(
            `You are an expert software developer.
                What is the function of the following code in one sentence?
                {input}`
        )
        const reducePrompt = PromptTemplate.fromTemplate(
            `You are an expert software developer
            The summaries between the brackets describe parts of a long code file. 
            Combine and briefly summarize them: ({summaries})
            `
        );

        this.chain = new MapReducerChain(modelAndPrompt.model, mapPrompt,reducePrompt)

    }


    public override async summarize(input: string): Promise<ChainValues> {
        return await this.chain.call({ input: input });
    }

    public override getType(): string {
        return "MapReduceChainSummarizer";
    }
}