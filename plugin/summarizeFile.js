"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const electron_1 = require("electron");
const pluginFacade_1 = require("../dist/pluginFacade");
const SingleShotSummarizer_1 = require("./summarizeFile/SingleShotSummarizer");
const SummaryOpenAI_1 = require("./summarizeFile/SummaryOpenAI");
const MapReduceChainSummarizer_1 = require("./summarizeFile/MapReduceChainSummarizer");
pluginFacade_1.contextMenu.addFileBoxMenuItem((item) => new pluginFacade_1.MenuItemFile({ label: "Summarize File", click: () => summarize(item) }));
function _loadBoxFileData(box) {
    const path = box.getSrcPath();
    return (0, fs_1.readFileSync)(path, "utf8");
}
function _summarizerFactory(source) {
    const llm = new SummaryOpenAI_1.SummaryOpenAI().getLLM();
    if (source.length > 4000) {
        return new MapReduceChainSummarizer_1.MapReduceChainSummarizer({ model: llm });
    }
    return new SingleShotSummarizer_1.SingleShotSummarizer({ model: llm });
}
async function summarize(box) {
    // TODO add info to settings
    // TODO add tests
    const source = _loadBoxFileData(box);
    if (source.length > 4000) {
        // TODO use popup from facade
        const doYouWantToProceed = await electron_1.dialog.showMessageBox({
            message: "The file it to long to summarize it with one call to the llm. Should we try to summarize it with multiple calls?",
            type: "question", buttons: ["OK", "Cancel"]
        });
        if (!doYouWantToProceed) {
            return;
        }
    }
    const summarizer = _summarizerFactory(source);
    try {
        const summary = await summarizer.summarize(source);
        console.log(summary);
        //TODO extra daten zu Box hinzufügen
        box.getBody().setContent("<h2>Summary</h2><p>" + summary.text + "</p>");
    }
    catch (err) {
        console.error(err);
    }
    return;
}
