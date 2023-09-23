import { PromptTemplate } from "langchain/prompts";
import { BaseLLM} from "langchain/dist/llms/base";
import { ConsoleCallbackHandler } from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import { Summarizer } from "./Summarizer";

export class SingleShotSummarizer extends Summarizer{
    chain: LLMChain;

    constructor(modelAndPrompt:{model:BaseLLM,template?:PromptTemplate}){
        super();
        if(!modelAndPrompt.template){
            modelAndPrompt.template=PromptTemplate.fromTemplate(`
            You are an expert software developer.
            What is the function of the following code in one sentence?
        
            {source}
            `)
        }
        const callbacks= new ConsoleCallbackHandler();
        this.chain=new LLMChain({
            llm:modelAndPrompt.model,
            prompt:modelAndPrompt.template,
            verbose:true,
            callbacks:[callbacks]});
    }
    public async summarize(input:string) {
        return this.chain.call({source:input});   
    }
}

