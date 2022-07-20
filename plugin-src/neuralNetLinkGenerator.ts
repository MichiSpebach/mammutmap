import * as contextMenu from '../dist/contextMenu'
import * as pluginFacade from '../dist/pluginFacade'
import * as pathFinder from './neuralNetLinkGenerator/pathFinder'

contextMenu.addFileBoxMenuItem((box: pluginFacade.FileBox) => {
    return {label: 'generate outgoing links', action: () => generateOutgoingLinksForBox(box)}
})

async function generateOutgoingLinksForBox(box: pluginFacade.FileBox): Promise<void> {
    const fileContent: string = await box.getBody().getFileContent()
    const paths: string[] = pathFinder.findPaths(fileContent)
    // TODO: work in progress
}
