import { FolderBox } from '../dist/core/box/FolderBox'
import { SourcelessBox } from '../dist/core/box/SourcelessBox'
import * as pluginFacade from '../dist/pluginFacade'
import { fileSystem, renderManager, coreUtil, contextMenu, MenuItemFile, Box, FileBox, Link, ProgressBarWidget } from '../dist/pluginFacade'
import * as pathFinder from './neuralNetLinkGenerator/pathFinder'
import * as typeFinder from './neuralNetLinkGenerator/typeFinder'

contextMenu.addFileBoxMenuItem((box: FileBox) => {
	return new MenuItemFile({label: '⇉ generate outgoing links', click: () => generateOutgoingLinksForFile(box)})
})
contextMenu.addFolderBoxMenuItem((box: FolderBox) => {
	return new MenuItemFile({label: '⇉ generate outgoing links...', click: () => openDialogForGenerateOutgoingLinks(box)})
})

Box.Sidebar.BasicToolkit.add({
	topic: 'links',
	indexWithinTopic: 1,
	build: (box: Box) => {
		if (box instanceof FileBox) {
			return Box.Sidebar.BasicToolkit.buildButton('⇉ generate outgoing links', () => generateOutgoingLinksForFile(box))
		}
		if (box instanceof FolderBox) {
			return Box.Sidebar.BasicToolkit.buildButton('⇉ generate outgoing links...', () => openDialogForGenerateOutgoingLinks(box))
		}
		if (box instanceof SourcelessBox) {
			return undefined
		}
		console.warn(`neuralNetLinkGenerator::Box.Sidebar.BasicToolkit.add not implemented for BoxType ${box.constructor.name}.`)
		return undefined
	}
})

async function openDialogForGenerateOutgoingLinks(folder: FolderBox): Promise<void> {
	const dialogId = 'generateLinksDialog'+coreUtil.generateId()
	const maxFilesizeInputId = dialogId+'-maxFilesizeInput'
	const recursivelyInputId = dialogId+'-recursivelyInput'
	const pathsToIgnoreInputId = dialogId+'-pathsToIgnoreInput'
	const popup: pluginFacade.PopupWidget = await pluginFacade.PopupWidget.newAndRender({title: `Generate Outgoing Links of '${folder.getName()}'`, content: [
		{type: 'div', style: {marginTop: '8px'}, children: 'Are you sure?'},
		{
			type: 'ul',
			children: [
				{type: 'li', children: 'This may take a while (depending on how many files there are)'},
				{type: 'li', children: 'Lots of links may be added that are more confusing than helping because:'},
				{
					type: 'ul',
					children: [
						{type: 'li', children: 'There is an experimental linkBundler.js plugin, you should use it by calling "bundle links..." afterwards.'},
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
			innerHTML: `<input type="checkbox" id="${recursivelyInputId}" checked><label for="${recursivelyInputId}">recursively</label>`
		},
		{
			type: 'div',
			style: {display: 'flex'},
			children: [
				{
					type: 'span',
					children: 'if recursively, paths to ignore: '
				},
				{
					type: 'input',
					id: pathsToIgnoreInputId,
					style: {flexGrow: '1', marginLeft: '4px'},
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
				const recursively: boolean = await renderManager.getCheckedOf(recursivelyInputId)
				const pathsToIgnore: string[] = (await renderManager.getValueOf(pathsToIgnoreInputId)).split(',').map(path => coreUtil.concatPaths(folder.getSrcPath(), path.trim()))
				generateOutgoingLinks(folder, {
					maxFilesizeInKB,
					recursively,
					pathsToIgnoreIfRecursively: pathsToIgnore
				})
				popup.unrender()
			}
		}
	]})
}

async function generateOutgoingLinks(folder: FolderBox, options: {
	maxFilesizeInKB: number
	recursively: boolean
	pathsToIgnoreIfRecursively: string[]
}): Promise<void> {
	console.log(`Start generating outgoing links of '${folder.getSrcPath()}' with options ${JSON.stringify(options, null, '\t')}...`)
	if (!options.recursively) {
		await generateOutgoingLinksForFilesInFolder(folder)
		console.log(`Finished generating outgoing links of '${folder.getSrcPath()}'.`)
		return
	}

	const progressBar: ProgressBarWidget = await ProgressBarWidget.newAndRenderInMainWidget()
	let totalFileCountingFinished: boolean = false
	let totalFileCount: number = 0
	let fileCount: number = 0
	let foundLinksCount: number = 0
	let foundLinksAlreadyExistedCount: number = 0
	
	const countingFiles: Promise<void> = countFiles()
	
	const iterator = new pluginFacade.FileBoxDepthTreeIterator(folder, {srcPathsToIgnore: options.pathsToIgnoreIfRecursively})
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
		const iterator = new pluginFacade.FileBoxDepthTreeIterator(folder, {srcPathsToIgnore: options.pathsToIgnoreIfRecursively})
		for (; await iterator.hasNextOrUnwatch(); await iterator.next()) {
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

async function generateOutgoingLinksForFilesInFolder(folder: FolderBox): Promise<void> {
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
	if (normalizedBoxName.endsWith('.java')) {
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
