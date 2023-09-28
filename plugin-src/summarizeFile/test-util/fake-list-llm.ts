import { CallbackManagerForLLMRun } from "langchain/callbacks";
import { Generation, LLMResult } from "langchain/dist/schema";
import { BaseLLM, BaseLLMParams } from "langchain/llms/base";

export class FakeListLLM extends BaseLLM {
    private index = 0;
    private calledPrompts:string[]=[];
    constructor(private answers: string[], params?: BaseLLMParams) {
        super(params??{});
    }

    override async _generate(prompts: string[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun | undefined): Promise<LLMResult> {
        if(this.index>=this.answers.length){
          throw new Error("Out of answers");
        }
        this.calledPrompts=this.calledPrompts.concat(prompts);
        const result =this.answers[this.index];
        this.index+=1;

        const gen:Generation={text:result}
        const output:LLMResult={generations:[[gen]]};
        return output;

    }
    override _llmType(): string {
        return "FakeListLLM";
    }

    getCalledPrompts():string[]{
        return this.calledPrompts;
    }   
}