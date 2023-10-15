import { FakeListLLM } from "../test-util/fake-list-llm";
import { MapReduceChainSummarizer } from "./map-reduce-chain-summarizer";


const testData = Array(200).fill('a').map((_,index)=>"Inhalt von Zeile:"+index.toString(16).padEnd(2,'_')+"\n").join('');

describe("MapReduceChainSummarizer", () => {
    it("summarizes code with multiple calls to llm", async () => {
        const llmMock = new FakeListLLM(["This is a summary", "This is another summary", "this is the reduction"]);
        const underTest = new MapReduceChainSummarizer({ model: llmMock });


        const result = await underTest.summarize(testData);
        expect(result).toEqual({ text: "this is the reduction" });

        const calledPrompts= llmMock.getCalledPrompts();
        expect(calledPrompts.length).toEqual(3);
        expect(calledPrompts[0].split('\n')).toContain(calledPrompts[1].split('\n')[0]);// There must be an overlap between the chunks
        

    });
});