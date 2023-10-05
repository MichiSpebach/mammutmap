import { BaseLLM } from "langchain/dist/llms/base"

export abstract class SummaryLLM {
    public abstract getLLM(): BaseLLM
}

export type LLMConfig = { model: string, apiKey: string };
export type summaryLLMFactory = (config: LLMConfig) => SummaryLLM;