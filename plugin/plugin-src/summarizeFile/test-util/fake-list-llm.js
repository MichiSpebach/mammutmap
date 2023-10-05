"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeListLLM = void 0;
const base_1 = require("langchain/llms/base");
class FakeListLLM extends base_1.BaseLLM {
    constructor(answers, params) {
        super(params ?? {});
        this.answers = answers;
        this.index = 0;
        this.calledPrompts = [];
    }
    async _generate(prompts, options, runManager) {
        if (this.index >= this.answers.length) {
            throw new Error("Out of answers");
        }
        this.calledPrompts = this.calledPrompts.concat(prompts);
        const result = this.answers[this.index];
        this.index += 1;
        const gen = { text: result };
        const output = { generations: [[gen]] };
        return output;
    }
    _llmType() {
        return "FakeListLLM";
    }
    getCalledPrompts() {
        return this.calledPrompts;
    }
}
exports.FakeListLLM = FakeListLLM;
