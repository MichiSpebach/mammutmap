import { readFileSync } from "fs";


import { Box, log, FileBox, MenuItemFile, RenderElements, contextMenu, } from "../dist/pluginFacade"

import { SummarizerFactory } from "./summarizeFile/summarizer-factory";
import { openaiSummaryLLMFactory } from "./summarizeFile/llms/summary-openai";
import { ConfigManager } from "./summarizeFile/config-manager";

const SUMMARY_FIELD_NAME = 'summary';


contextMenu.addFileBoxMenuItem((item) => new MenuItemFile({ label: "Summarize File", click: () => 
                     summarize(item,new SummarizerFactory(openaiSummaryLLMFactory,new ConfigManager()))}));

Box.Tabs.register({
    name: 'Summary',
    isAvailableFor: (box: Box) => box.isFile(),
    buildWidget: (box: Box) => buildSummaryTabFor(box.getMapData().getRawField(SUMMARY_FIELD_NAME) as string)
});

function buildSummaryTabFor(summary: string): RenderElements {
    return {
        type: 'div',
        style: { border: '1px solid black', padding: '10px' },
        children: summary
    }
}

function _loadBoxFileData(box: FileBox): string {
    const path = box.getSrcPath();
    return readFileSync(path, "utf8");
}

async function summarize(box: FileBox,summarizerFactory: SummarizerFactory) {


    // TODO add tests
    const source = _loadBoxFileData(box);


    const summarizer = await summarizerFactory.getSummarizerFor(source);

    if (!summarizer.isPresent()) {
        log.errorWithoutThrow(summarizer.getError());
        return;
    }
    try {
        const summary = await summarizer.get().summarize(source);
        box.getMapData().setRawField(SUMMARY_FIELD_NAME, summary.text);
        box.saveMapData();
    } catch (err: any) {
        log.errorWithoutThrow(err.toString());
    }
    return;
}



