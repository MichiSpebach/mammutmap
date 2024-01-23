import { FolderBox } from '../dist/core/box/FolderBox'
import { SourcelessBox } from '../dist/core/box/SourcelessBox'
import * as pluginFacade from '../dist/pluginFacade'
import { fileSystem, renderManager, coreUtil, contextMenu, MenuItemFile, MenuItemFolder, Box, FileBox, Link, ProgressBarWidget } from '../dist/pluginFacade'
import * as pathFinder from './neuralNetLinkGenerator/pathFinder'
import * as typeFinder from './neuralNetLinkGenerator/typeFinder'

contextMenu.addFileBoxMenuItem((box: FileBox) => {
	return new MenuItemFile({label: 'generate outgoing links', click: () => generateOutgoingLinksForFile(box)})
})
contextMenu.addFolderBoxMenuItem((box: FolderBox) => {
	return new MenuItemFolder({label: 'generate outgoing links', submenu: [
		new MenuItemFile({label: 'for files in this folder only', click: () => generateOutgoingLinksForAllFilesInFolder(box)}),
		new MenuItemFile({label: 'recursively...', click: () => openDialogForGenerateOutgoingLinksRecursively(box)})
	]})
})

Box.Sidebar.BasicToolkit.add({
	topic: 'links',
	indexWithinTopic: 1,
	build: (box: Box) => {
		if (box instanceof FileBox) {
			return Box.Sidebar.BasicToolkit.buildButton('generate outgoing links', () => generateOutgoingLinksForFile(box))
		}
		if (box instanceof FolderBox) {
			return Box.Sidebar.BasicToolkit.buildGroup({
				title: 'Generate Outgoing Links',
				color: 'lime',
				elements: [
					Box.Sidebar.BasicToolkit.buildButton('for files in this folder only', () => generateOutgoingLinksForAllFilesInFolder(box)),
					Box.Sidebar.BasicToolkit.buildButton('recursively...', () => openDialogForGenerateOutgoingLinksRecursively(box))
				]
			})
		}
		if (box instanceof SourcelessBox) {
			return undefined
		}
		console.warn(`neuralNetLinkGenerator::Box.Sidebar.BasicToolkit.addElement not implemented for BoxType ${box.constructor.name}.`)
		return undefined
	}
})

async function openDialogForGenerateOutgoingLinksRecursively(folder: FolderBox): Promise<void> {
	const dialogId = 'generateLinksDialog'+coreUtil.generateId()
	const maxFilesizeInputId = dialogId+'-maxFilesizeInput'
	const pathsToIgnoreInputId = dialogId+'-pathsToIgnoreInput'
	const popup: pluginFacade.PopupWidget = await pluginFacade.PopupWidget.newAndRender({title: 'Generate Outgoing Links Recursively', content: [
		{type: 'div', style: {marginTop: '8px'}, children: 'Are you sure?'},
		{
			type: 'ul',
			children: [
				{type: 'li', children: 'This may take a while (depending on how many files there are)'},
				{type: 'li', children: 'Lots of links may be added that are more confusing than helping because:'},
				{
					type: 'ul',
					children: [
						{type: 'li', children: 'There is no linkBundler.js plugin yet'},
						{type: 'li', children: 'There is no boxOrderer.js plugin yet'},
						{type: 'li', children: 'There is no autoTagger.js plugin yet'},
						{type: 'li', children: `BorderingLinks with appearance mode 'renderedEnds' are not hidden while hovering box yet.`},
					]
				}
			]
		},
		{
			type: 'div',
			children: [
				{
					type: 'span',
					children: 'Max filesize in kB: '
				},
				{
					type: 'input',
					id: maxFilesizeInputId,
					value: '100'
				}
			]
		},
		{
			type: 'div',
			children: [
				{
					type: 'span',
					children: 'Paths to ignore: '
				},
				{
					type: 'input',
					id: pathsToIgnoreInputId,
					value: 'map, .git, node_modules, venv, .venv, .mvn, target, dist, out'
				}
			]
		},
		{
			type: 'button', 
			children: `Yes, bring in on!`, 
			style: {marginTop: '8px'},
			onclick: async () => {
				const maxFilesizeInKB: number = Number(await renderManager.getValueOf(maxFilesizeInputId))
				if (!(maxFilesizeInKB >= 0)) { // < 0 would be false for NaN
					throw new Error('maxFilesizeInKB has to be >= 0 but is '+maxFilesizeInKB)
				}
				const pathsToIgnore: string[] = (await renderManager.getValueOf(pathsToIgnoreInputId)).split(',')
				const rootPath: string = pluginFacade.getRootFolder().getSrcPath()
				generateOutgoingLinksRecursively(folder, {
					maxFilesizeInKB,
					srcPathsToIgnore: pathsToIgnore.map(path => coreUtil.concatPaths(rootPath, path.trim()))
				})
				popup.unrender()
			}
		}
	]})
}

async function generateOutgoingLinksRecursively(folder: FolderBox, options: {
	maxFilesizeInKB: number
	srcPathsToIgnore: string[]
}): Promise<void> {
	console.log(`Start generating outgoing links recursively of '${folder.getSrcPath()}' with options '${JSON.stringify(options)}'...`)
	const progressBar: ProgressBarWidget = await ProgressBarWidget.newAndRenderInMainWidget()
	let totalFileCountingFinished: boolean = false
	let totalFileCount: number = 0
	let fileCount: number = 0
	let foundLinksCount: number = 0
	let foundLinksAlreadyExistedCount: number = 0
	
	const countingFiles: Promise<void> = countFiles()
	
	const iterator = new pluginFacade.FileBoxDepthTreeIterator(folder, options)
	while (await iterator.hasNextOrUnwatch()) {
		const box: FileBox = await iterator.next()
		fileCount++
		updateProgressBar()
		if ((await fileSystem.getDirentStatsOrThrow(box.getSrcPath())).size > options.maxFilesizeInKB*1000) {
			continue
		}
		await generateOutgoingLinksForFile(box, {onLinkAdded: (report) => {
			foundLinksCount += report.linkRoute ? 1 : 0
			foundLinksAlreadyExistedCount += report.linkRouteAlreadyExisted ? 1 : 0
			updateProgressBar()
		}})
	}

	await countingFiles
	await progressBar.finishAndRemove()
	console.log(`Finished ${buildProgressText()}.`)

	async function countFiles(): Promise<void> {
		for (const iterator = new pluginFacade.FileBoxDepthTreeIterator(folder, options); await iterator.hasNextOrUnwatch(); await iterator.next()) {
			totalFileCount++
			updateProgressBar()
		}
		totalFileCountingFinished = true
	}

	async function updateProgressBar(): Promise<void> {
		const percent: number|undefined = totalFileCountingFinished ? fileCount/totalFileCount * 100 : undefined
		const percentText: string = percent ? ` (${Math.round(percent*100)/100}%)` : ''
		await progressBar.set({text: buildProgressText()+percentText, percent})
	}

	function buildProgressText(): string {
		let text: string = `generating outgoing links recursively: analyzed ${fileCount} of ${totalFileCount} files`
		text += `, found ${foundLinksCount} links, ${foundLinksAlreadyExistedCount} of them already existed`
		return text
	}
}

async function generateOutgoingLinksForAllFilesInFolder(folder: FolderBox): Promise<void> {
	for (const box of folder.getChilds()) {
		if (!(box instanceof FileBox)) {
			continue
		}
		await generateOutgoingLinksForFile(box)
	}
}

async function generateOutgoingLinksForFile(box: FileBox, options?: {
	onLinkAdded?: (report: {linkRoute: Link[]|undefined, linkRouteAlreadyExisted: boolean, warnings?: string[]}) => void
}): Promise<void> {
	const fileContent: string = await box.getBody().getFileContent()

	let paths: string[] = pathFinder.findPaths(fileContent)

	const normalizedBoxName: string = box.getName().toLowerCase()
	if (normalizedBoxName.endsWith('.java') || normalizedBoxName.endsWith('.py')) {
		const otherTypesInFolder: string[] = getSiblingFileNamesWithoutEndings(box)
		paths = paths.concat(typeFinder.findTypesInText(otherTypesInFolder, fileContent))
	}

	let foundLinksCount: number = 0
	let foundLinksAlreadyExistedCount: number = 0
	await Promise.all(paths.map(async path => {
		const report = await pluginFacade.addLink(box, path, {onlyReturnWarnings: true, delayUnwatchingOfBoxesInMS: 500})
		if (options?.onLinkAdded) {
			options.onLinkAdded(report)
		}
		foundLinksCount += report.linkRoute ? 1 : 0
		foundLinksAlreadyExistedCount += report.linkRouteAlreadyExisted ? 1 : 0
	}))

	coreUtil.logInfo(`Found ${foundLinksCount} links for '${box.getName()}', ${foundLinksAlreadyExistedCount} of them already existed.`)
}

function getSiblingFileNamesWithoutEndings(box: Box): string[] {
	return getSiblings(box).map((sibling: Box) => {
		const parts: string[] = sibling.getName().split('.')
		if (parts[0].length === 0) {
			return '.'+parts[1]
		}
		return parts[0]
	})
}

function getSiblings(box: Box): Box[] {
	if (box.isRoot()) {
		return []
	}
	return box.getParent().getBoxes().filter(other => other !== box)
}
