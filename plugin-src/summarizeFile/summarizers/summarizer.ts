import { ChainValues } from "langchain/dist/schema";

export abstract class Summarizer {
    public abstract summarize(input: string): Promise<ChainValues>;
    public abstract getType(): string;
}