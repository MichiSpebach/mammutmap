import { readFileSync } from "fs";
import { dialog } from "electron"

import { Box, FileBox, MenuItemFile, TextInputPopup, RenderElements, applicationSettings, contextMenu, } from "../dist/pluginFacade"
import { SingleShotSummarizer } from "./summarizeFile/SingleShotSummarizer";

import { SummaryOpenAI } from "./summarizeFile/SummaryOpenAI";
import { Summarizer } from "./summarizeFile/Summarizer";

import { MapReduceChainSummarizer } from "./summarizeFile/MapReduceChainSummarizer";

contextMenu.addFileBoxMenuItem((item) => new MenuItemFile({ label: "Summarize File", click: () => summarize(item) }));

function _loadBoxFileData(box: FileBox): string {
    const path = box.getSrcPath();
    return readFileSync(path, "utf8");
}

function _summarizerFactory(source: string, config: { model: string, apiKey: string }): Summarizer {
    const llm = new SummaryOpenAI(config).getLLM();
    if (source.length > 4000) {
        return new MapReduceChainSummarizer({ model: llm });
    }
    return new SingleShotSummarizer({ model: llm });
}

async function summarize(box: FileBox) {

    const config = await _loadOrCreateConfig();
    // 25/09/2023  
    // TODO: catch error if no key is provided
    // 25/09/2023  
    // TODO: Refactor

    // TODO add tests
    const source = _loadBoxFileData(box);

    if (source.length > 4000) {
        // TODO use popup from facade
        const doYouWantToProceed = await dialog.showMessageBox({
            message: "The file it to long to summarize it with one call to the llm. Should we try to summarize it with multiple calls?",
            type: "question", buttons: ["OK", "Cancel"]
        });
        if (!doYouWantToProceed) {
            return;
        }
    }
    const summarizer = _summarizerFactory(source, config);

    try {
        const summary = await summarizer.summarize(source);
        console.log(summary);
        Box.Tabs.register({
            name: 'Summary',
            isAvailableFor: (box: Box) => box.isFile(),
            buildWidget: (box: Box) => buildSummaryTabFor(box, summary.text)
        });
    } catch (err) {
        console.error(err);
    }
    return;
}

function buildSummaryTabFor(box: Box, summary: string): RenderElements {
    return {
        type: 'div',
        children: summary
    }
}

async function _loadOrCreateConfig(): Promise<{ model: string, apiKey: string }> {
    const apiKey = applicationSettings.getRawField('openaiApiKey');
    if (apiKey) {
        return { model: 'openai', apiKey: apiKey.toString() };
    }

    const newApiKey = await TextInputPopup.buildAndRenderAndAwaitResolve('Please enter a valid openai key', '');//TODO get from popup
    applicationSettings.setRawField('openaiApiKey', newApiKey);
    if (!newApiKey) {
        throw new Error('No openai key provided');
    }
    return { model: 'openai', apiKey: newApiKey };
}

