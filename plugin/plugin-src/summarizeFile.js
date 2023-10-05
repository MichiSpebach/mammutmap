"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const pluginFacade_1 = require("../src/pluginFacade");
const SUMMARY_FIELD_NAME = 'summary';
pluginFacade_1.contextMenu.addFileBoxMenuItem((item) => new pluginFacade_1.MenuItemFile({ label: "Summarize File", click: () => console.error("hi") }));
// summarize(item,new SummarizerFactory(openaiSummaryLLMFactory,new ConfigManager()))
pluginFacade_1.Box.Tabs.register({
    name: 'Summary',
    isAvailableFor: (box) => box.isFile(),
    buildWidget: (box) => buildSummaryTabFor(box.getMapData().getRawField(SUMMARY_FIELD_NAME))
});
function buildSummaryTabFor(summary) {
    return {
        type: 'div',
        style: { border: '1px solid black', padding: '10px' },
        children: summary
    };
}
function _loadBoxFileData(box) {
    const path = box.getSrcPath();
    return (0, fs_1.readFileSync)(path, "utf8");
}
async function summarize(box, summarizerFactory) {
    // TODO add tests
    const source = _loadBoxFileData(box);
    const summarizer = await summarizerFactory.getSummarizerFor(source);
    if (!summarizer.isPresent()) {
        pluginFacade_1.log.errorWithoutThrow(summarizer.getError());
        return;
    }
    try {
        const summary = await summarizer.get().summarize(source);
        box.getMapData().setRawField(SUMMARY_FIELD_NAME, summary.text);
        box.saveMapData();
    }
    catch (err) {
        pluginFacade_1.log.errorWithoutThrow(err.toString());
    }
    return;
}
