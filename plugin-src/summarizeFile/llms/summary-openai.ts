import { BaseLLM } from "langchain/dist/llms/base";
import { LLMConfig, SummaryLLM, summaryLLMFactory } from "./summary-llm";
import { OpenAI } from "langchain/llms/openai";

export class SummaryOpenAI extends SummaryLLM{
    private llm:BaseLLM;
    public override getLLM(): BaseLLM {
        return this.llm;
    }
    constructor(config:{model:string,apiKey:string}){
        super();
        if(config.model!="openai"){
            throw new Error("This class is only for openai");
        }
        const key= config.apiKey;
        this.llm = new OpenAI({openAIApiKey:key,modelName:"gpt-3.5-turbo"});
    }

}
export const openaiSummaryLLMFactory:summaryLLMFactory = (config: LLMConfig) => {
    return new SummaryOpenAI(config);
};