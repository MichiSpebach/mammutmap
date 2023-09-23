import { BaseLLM } from "langchain/dist/llms/base";
import { SummaryLLM } from "./SummaryLLM";
import { OpenAI } from "langchain/llms/openai";
import { readFileSync } from "fs";

export class SummaryOpenAI extends SummaryLLM{
    private llm:BaseLLM;
    public override getLLM(): BaseLLM {
        return this.llm;
    }
    constructor(){
        super();
        const key= readFileSync("/home/thj/.openai/key.key","utf-8");
        this.llm = new OpenAI({openAIApiKey:key,modelName:"gpt-3.5-turbo"});
    }

}