"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const pluginFacade_1 = require("../src/pluginFacade");
const SummarizerFactory_1 = require("./summarizeFile/SummarizerFactory");
pluginFacade_1.contextMenu.addFileBoxMenuItem((item) => new pluginFacade_1.MenuItemFile({ label: "Summarize File", click: () => summarize(item) }));
function _loadBoxFileData(box) {
    const path = box.getSrcPath();
    return (0, fs_1.readFileSync)(path, "utf8");
}
async function summarize(box) {
    // TODO add tests
    const source = _loadBoxFileData(box);
    const summarizer = await new SummarizerFactory_1.SummarizerFactory().getSummarizerFor(source);
    if (!summarizer.isPresent()) {
        pluginFacade_1.log.errorWithoutThrow(summarizer.getError());
        return;
    }
    try {
        const summary = await summarizer.get().summarize(source);
        console.log(summary);
        pluginFacade_1.Box.Tabs.register({
            name: 'Summary',
            isAvailableFor: (box) => box.isFile(),
            buildWidget: (box) => buildSummaryTabFor(box, summary.text)
        });
    }
    catch (err) {
        pluginFacade_1.log.errorWithoutThrow(err.toString());
    }
    return;
}
function buildSummaryTabFor(box, summary) {
    return {
        type: 'div',
        style: { border: '1px solid black', padding: '10px' },
        children: summary
    };
}
