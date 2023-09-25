import { BaseLLM } from "langchain/dist/llms/base";
import { SummaryLLM } from "./SummaryLLM";
import { OpenAI } from "langchain/llms/openai";
import { readFileSync } from "fs";

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