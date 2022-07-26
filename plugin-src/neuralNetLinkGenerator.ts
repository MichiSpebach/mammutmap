import * as contextMenu from '../dist/contextMenu'
import * as pluginFacade from '../dist/pluginFacade'
import { FileBox } from '../dist/pluginFacade'
import * as pathFinder from './neuralNetLinkGenerator/pathFinder'

contextMenu.addFileBoxMenuItem((box: FileBox) => {
    return {label: 'generate outgoing links', action: () => generateOutgoingLinksForBox(box)}
})

async function generateOutgoingLinksForBox(box: FileBox): Promise<void> {
    const fileContent: string = await box.getBody().getFileContent()
    const paths: string[] = pathFinder.findPaths(fileContent)

    await Promise.all(paths.map(async path => {
        await pluginFacade.addLink(box, path)
    }))
}
