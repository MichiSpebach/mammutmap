import { readFileSync } from "fs";


import { Box, log, FileBox, MenuItemFile, RenderElements, contextMenu, } from "../src/pluginFacade"

import { SummarizerFactory } from "./summarizeFile/SummarizerFactory";

contextMenu.addFileBoxMenuItem((item) => new MenuItemFile({ label: "Summarize File", click: () => summarize(item) }));

function _loadBoxFileData(box: FileBox): string {
    const path = box.getSrcPath();
    return readFileSync(path, "utf8");
}

async function summarize(box: FileBox) {


    // TODO add tests
    const source = _loadBoxFileData(box);


    const summarizer = await new SummarizerFactory().getSummarizerFor(source);

    if (!summarizer.isPresent()) {
        log.errorWithoutThrow(summarizer.getError());
        return;
    }
    try {
        const summary = await summarizer.get().summarize(source);
        console.log(summary);
        Box.Tabs.register({
            name: 'Summary',
            isAvailableFor: (box: Box) => box.isFile(),
            buildWidget: (box: Box) => buildSummaryTabFor(summary.text)
        });
    } catch (err: any) {
        log.errorWithoutThrow(err.toString());
    }
    return;
}

function buildSummaryTabFor(summary: string): RenderElements {
    return {
        type: 'div',
        style: { border: '1px solid black', padding: '10px' },
        children: summary
    }
}

