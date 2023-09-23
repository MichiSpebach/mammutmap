/*import { SummaryOpenAI } from "../SummaryOpenAI";
import { MapReduceSummarizer } from "../MapReduceSummarizer";
import { readFileSync } from "fs";


const llm= new SummaryOpenAI().getLLM();


const input = readFileSync("./Map.ts","utf8");
const elements= new MapReduceSummarizer({model:llm})

const result=elements.summarize(input);
console.log(result);
*/