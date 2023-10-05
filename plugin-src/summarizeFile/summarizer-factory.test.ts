import { ConfigManager, ConfigManagerInterface } from "./config-manager";
import { LLMConfig, SummaryLLM } from "./llms/summary-llm";
import { SummarizerFactory } from "./summarizer-factory";
import { FakeListLLM } from "./test-util/fake-list-llm";
import { Result } from "./util/result";


// klassenzyklus irgendwo wird FileBox aufgelöst und Box ist noch nicht da
class MockSummaryLLM extends SummaryLLM{
    public getLLM(){
        return new FakeListLLM([]);
    }
}

class MockConfigManager extends ConfigManagerInterface{
    constructor(private output:Promise<Result<{ model: string; apiKey: string; }>>){
        super();
    }

    loadOrCreateConfig(): Promise<Result<{ model: string; apiKey: string; }>> {
        return this.output;
    }

}

describe("SummarizerFactory", () => {
    /*let underTest: SummarizerFactory;
    const setup=(config:Promise<Result<{ model: string; apiKey: string; }>>)=>{
        const configManager = new MockConfigManager(config);
        underTest = new SummarizerFactory((config:LLMConfig)=>new MockSummaryLLM(),configManager);
    }

    it("creates a SingleShotSummarizer for short inputs",async()=>{
       setup(Promise.resolve(Result.of({model:'openai',apiKey:'key'})));
       const shortInput= "short input";
       const result = await underTest.getSummarizerFor(shortInput);

       expect(result.isPresent()).toBeTruthy();
       expect(result.get().getType()).toEqual("SingleShotSummarizer");
    });*/
    it("creates a MapReduceChainSummarizer for long inputs when permission is granted ",()=>{
        //TODO
    });
    it("returns an error when permission is not granted",()=>{
        //TODO
    });
});
