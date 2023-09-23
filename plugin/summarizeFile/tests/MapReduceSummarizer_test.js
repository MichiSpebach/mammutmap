"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const langchain_1 = require("langchain");
const FakeListLLM_1 = require("./FakeListLLM");
//test("Summarizer cuts text into chunks and calls an llm on each chunk and then finally once to summarize all summaries",async ()=>{
const answer = ["Dies ist eine Antwort"];
const llm = new FakeListLLM_1.FakeListLLM(answer);
const chain = new langchain_1.LLMChain({ llm: llm, prompt: langchain_1.PromptTemplate.fromTemplate("This is a question: {value}") });
chain.call({ value: "Really?" }).then((result) => console.log(result));
//expect(result.text).toBe("antwort");
//});
