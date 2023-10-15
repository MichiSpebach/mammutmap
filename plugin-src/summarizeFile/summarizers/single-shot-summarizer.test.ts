import {SingleShotSummarizer} from "./single-shot-summarizer";
import {FakeListLLM} from '../test-util/fake-list-llm';

describe("SingleShortSummarizer", () => {


    it("calls llm to summarize code",async ()=>{
        const llmMock = new FakeListLLM(["This is a summary"]);
        const underTest= new SingleShotSummarizer({model:llmMock});
        const result= await underTest.summarize("some code");
        expect(result).toEqual({text:"This is a summary"});
        const mapRegex= /\s{2,}/g;
        expect(llmMock.getCalledPrompts()[0].replace(mapRegex,' ')).toEqual(" You are an expert software developer. What is the function of the following code in one sentence? some code ");
    })
});