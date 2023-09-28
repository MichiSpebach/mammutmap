import { ChainValues } from "langchain/dist/schema";
import { Document } from "langchain/document"

export abstract class Summarizer {
    public abstract summarize(input: string): Promise<ChainValues>;
}