import { BaseLLM } from "langchain/dist/llms/base"

export abstract class SummaryLLM{
    public abstract getLLM():BaseLLM
}