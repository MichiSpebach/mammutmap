import { BoxLinks } from '../dist/core/box/BoxLinks'
import { Box } from '../dist/core/box/Box'
import { BoxWatcher } from '../dist/core/box/BoxWatcher'
import { Link } from '../dist/core/link/Link'
import { WayPointData } from '../dist/core/mapData/WayPointData'
import { NodeWidget } from '../dist/core/node/NodeWidget'
import * as contextMenu from '../dist/core/contextMenu'
import { applicationMenu } from '../dist/core/applicationMenu/applicationMenu'
import { MenuItemFile } from '../dist/core/applicationMenu/MenuItemFile'
import * as bundler from './linkBundler/bundler'
import * as pluginFacade from '../dist/pluginFacade'
import { FolderBox, ProgressBarWidget, RenderElement, coreUtil, renderManager } from '../dist/pluginFacade'
import * as knotMerger from './linkBundler/knotMerger'
import { HighlightPropagatingLink } from './linkBundler/HighlightPropagatingLink'

pluginFacade.overrideLink(HighlightPropagatingLink)

contextMenu.addLinkMenuItem((link: Link) => new MenuItemFile({label: 'try to bundle', click: () => bundler.bundleLink(link)}))
contextMenu.addLinkNodeMenuItem((node: NodeWidget) => new MenuItemFile({label: 'try to merge', click: () => knotMerger.mergeKnot(node)}))

Box.Sidebar.BasicToolkit.add({
	topic: 'links',
	indexWithinTopic: 1,
	build: (box: Box) => Box.Sidebar.BasicToolkit.buildButton('bundle links...', () => openDialogForBundleLinks(box))
})

async function openDialogForBundleLinks(box: Box): Promise<void> {
	const modeGroupId: string = coreUtil.generateId()
	const modeAutoMaintained: string = coreUtil.generateId()
	const modeAllId: string = coreUtil.generateId()
	const borderingLinksId: string = coreUtil.generateId()
	const managedLinksId: string = coreUtil.generateId()
	const recursivelyId: string = coreUtil.generateId()
	const pathsToIgnoreId: string = coreUtil.generateId()
	const content: RenderElement[] = [
		{
			type: 'div',
			innerHTML: `<input type="radio" id="${modeAutoMaintained}" name="${modeGroupId}" checked><label for="${modeAutoMaintained}">autoMaintained</label>`
		},
		{
			type: 'div',
			innerHTML: `<input type="radio" id="${modeAllId}" name="${modeGroupId}" ><label for="${modeAllId}">all</label>`
		},
		{
			type: 'div',
			innerHTML: `<input type="checkbox" id="${borderingLinksId}" checked><label for="${borderingLinksId}">bordering</label>`
		},
		{
			type: 'div',
			style: {marginTop: '4px'},
			innerHTML: `<input type="checkbox" id="${managedLinksId}" checked><label for="${managedLinksId}">managed</label>`
		}
	]
	const boxIsFolder: boolean = box instanceof FolderBox
	if (boxIsFolder) {
		content.push(
			{
				type: 'div',
				style: {marginTop: '4px'},
				innerHTML: `<input type="checkbox" id="${recursivelyId}"><label for="${recursivelyId}">recursively (This may take a while, depending on how many files there are)</label>`
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
						id: pathsToIgnoreId,
						style: {flexGrow: '1', marginLeft: '4px'},
						value: 'map, .git, node_modules, venv, .venv, .mvn, target, dist, out'
					}
				]
			}
		)
	}
	content.push({
		type: 'button',
		style: {marginTop: '4px'},
		children: 'Start',
		onclick: async () => {
			bundleLinksRecursively(box, await promiseAllOfObject({
				mode: renderManager.getCheckedOf(modeAllId).then(modeAllChecked => modeAllChecked ? 'all' : 'autoMaintained'), 
				bordering: renderManager.getCheckedOf(borderingLinksId),
				managed: renderManager.getCheckedOf(managedLinksId),
				recursively: boxIsFolder ? renderManager.getCheckedOf(recursivelyId) : false,
				pathsToIgnoreIfRecursively: boxIsFolder ? renderManager.getValueOf(pathsToIgnoreId).then(pathsToIgnore => pathsToIgnore.split(',').map(path => path.trim())) : []
			}))
			popup.unrender()
		}
	})
	const popup: pluginFacade.PopupWidget = await pluginFacade.PopupWidget.newAndRender({title: 'Bundle Links', content})
}

async function promiseAllOfObject<T extends Object>(obj: T): Promise<{
	[key in keyof T]: Awaited<T[key]>
}> {
	const entries = Object.entries(obj).map(async ([key, value]) => [key, await value])
	return Object.fromEntries(await Promise.all(entries))
}

async function bundleLinksRecursively(box: Box, options: {
	mode: 'autoMaintained'|'all'
	bordering: boolean
	managed: boolean
	recursively: boolean
	pathsToIgnoreIfRecursively: string[]
}): Promise<void> {
	console.info(`Start bundling links of '${box.getSrcPath()}' with options '${JSON.stringify(options)}'...`)
	const progressBar: ProgressBarWidget = await ProgressBarWidget.newAndRenderInMainWidget()
	let countingFinished: boolean = false
	let boxCount: number = 1
	let linkCount: number = 0
	let processedBoxCount: number = 0
	let processedLinkCount: number = 0
	let currentBox: Box|undefined = box
	const counting: Promise<void> = count()

	if (options.bordering) {
		await bundleLinksSequentially(box.borderingLinks.getAll())
	}
	if (options.managed) {
		await bundleLinksSequentially(box.links.getLinks())
	}
	processedBoxCount++
	if (options.recursively && box instanceof FolderBox) {
		const iterator = new pluginFacade.BoxDepthTreeIterator(box, {srcPathsToIgnore: options.pathsToIgnoreIfRecursively})
		while (await iterator.hasNextOrUnwatch()) {
			const next: Box = await iterator.next()
			if (next === box) {
				continue
			}
			currentBox = next
			await bundleLinksSequentially(next.links.getLinks())
			processedBoxCount++
			updateProgressBar()
		}
	}

	await counting
	await progressBar.finishAndRemove()
	currentBox = undefined
	console.info(`Finished ${buildProgressText()}.`)

	async function count(): Promise<void> {
		if (options.bordering) {
			linkCount += box.borderingLinks.getAll().length
		}
		if (options.managed) {
			linkCount += box.links.getLinks().length
		}
		updateProgressBar()
		if (options.recursively && box instanceof FolderBox) {
			const iterator = new pluginFacade.BoxDepthTreeIterator(box, {srcPathsToIgnore: options.pathsToIgnoreIfRecursively})
			while (await iterator.hasNextOrUnwatch()) {
				const next: Box = await iterator.next()
				if (next === box) {
					continue
				}
				boxCount++
				linkCount += next.links.getLinks().length
				updateProgressBar()
			}
		}
		countingFinished = true
	}

	async function bundleLinksSequentially(links: Link[]): Promise<void> {
		for (const link of links) {
			await bundleLink(link)
		}
	}

	async function bundleLink(link: Link): Promise<void> {
		if (!link.getManagingBox().links.getLinks().includes(link)) {
			console.warn(`linkBundler::bundleLink(link: "${link.describe()}") link was removed in meanwhile.`)
			return
		}
		if (options.mode === 'all' || link.isAutoMaintained()) {
			await bundler.bundleLink(link, {unwatchDelayInMs: 500}).catch((reason) => console.warn(reason))
		}
		processedLinkCount++
		updateProgressBar()
	}

	async function updateProgressBar(): Promise<void> {
		//const linksPerBox: number = linkCount / boxCount // TODO: use and improve percentage or remove linkCount variable
		const percent: number|undefined = countingFinished ? processedBoxCount/boxCount * 100 : undefined
		const percentText: string = percent ? ` (${Math.round(percent*100)/100}%)` : ''
		await progressBar.set({text: buildProgressText()+percentText, percent})
	}

	function buildProgressText(): string {
		const currentBoxText = currentBox ? `, currently '${coreUtil.removeStartFromPath(box.getSrcPath(), currentBox.getSrcPath())}'` : '' // TODO: reduce width changes of progressBar
		return `bundling links: box ${processedBoxCount} of ${boxCount}${currentBoxText}, processed ${processedLinkCount} links`
	}
}

let bundleNewLinksActivated: boolean = false
let addLinkBackup: ((options: any) => Promise<Link>) = BoxLinks.prototype.add

const activateBundleNewLinksItem = new MenuItemFile({label: 'activate bundle new links', enabled: !bundleNewLinksActivated, click() {
	applicationMenu.setMenuItemEnabled(activateBundleNewLinksItem, false)
	applicationMenu.setMenuItemEnabled(deactivateBundleNewLinksItem, true)
	activateBundleNewLinks()
}})
const deactivateBundleNewLinksItem = new MenuItemFile({label: 'deactivate bundle new links', enabled: bundleNewLinksActivated, click() {
	applicationMenu.setMenuItemEnabled(activateBundleNewLinksItem, true)
	applicationMenu.setMenuItemEnabled(deactivateBundleNewLinksItem, false)
	deactivateBundleNewLinks()
}})

// ?. because applicationMenu is not initialized for unit tests
applicationMenu?.addMenuItemTo('linkBundler.js', activateBundleNewLinksItem)
applicationMenu?.addMenuItemTo('linkBundler.js', deactivateBundleNewLinksItem)

function activateBundleNewLinks(): void {
	if (bundleNewLinksActivated) {
		console.warn(`bundleNewLinks is already activated`)
		return
	}
	bundleNewLinksActivated = true
	addLinkBackup = BoxLinks.prototype.add
	BoxLinks.prototype.add = async function (options) {
		const link: Link = await addLinkBackup.call(this, options)
		scheduleBundleLink(link)
		return link
	}
	console.info(`bundleNewLinks activated`)
}

function deactivateBundleNewLinks(): void {
	if (!bundleNewLinksActivated) {
		console.warn(`bundleNewLinks is already deactivated`)
		return
	}
	bundleNewLinksActivated = false
	BoxLinks.prototype.add = addLinkBackup
	console.info(`bundleNewLinks deactivated`)
}

const queue: {linkId: string, managingBoxSrcPath: string}[] = []
let processing: boolean = false

function scheduleBundleLink(link: Link): void {
	queue.push({linkId: link.getId(), managingBoxSrcPath: link.getManagingBox().getSrcPath()})
	processQueue()
}

async function processQueue(): Promise<void> {
	if (processing) {
		return
	}
	processing = true
	updateProgressBar()
	
	for (let element = queue.pop(); element; element = queue.pop()) {
		const {boxWatcher: managingBox} = await pluginFacade.getMapOrError().getBoxBySourcePathAndRenderIfNecessary(element.managingBoxSrcPath)
		if (!managingBox) {
			console.warn(`linkBundler.processQueue() failed to getBoxBySourcePathAndRenderIfNecessary('${element.managingBoxSrcPath}')`)
			continue
		}
		const link: Link|undefined = (await managingBox.get()).links.getLinks().find(link => link.getId() === element!.linkId)
		if (!link) {
			console.warn(`linkBundler.processQueue() managingBox '${element.managingBoxSrcPath}' does not contain link with id '${element.linkId}'`)
			continue
		}
		await bundler.bundleLink(link, {unwatchDelayInMs: 500})
		
		managingBox.unwatch()
		updateProgressBar()
	}

	processing = false
}

const progressBarId: string = 'linkBundlerProgressBar'+coreUtil.generateId()
//const progressBar = new ProgressBarWidget(progressBarId) // TODO
let progressBarMounted: boolean = false

async function updateProgressBar(): Promise<void> {
	if (queue.length === 0) {
		await removeProgressBar()
		return
	}
	const innerShape: pluginFacade.RenderElements = `scheduled ${queue.length} links to bundle`
	if (!progressBarMounted) {
		progressBarMounted = true
		await pluginFacade.renderManager.addElementTo(pluginFacade.mainWidget.getId(), {
			type: 'div',
			id: progressBarId,
			style: {
				position: 'absolute',
				right: '20%',
				bottom: '15%',
				margin: '8px'
			},
			children: innerShape
		})
	} else {
		await pluginFacade.renderManager.setElementsTo(progressBarId, innerShape)
	}
}

async function removeProgressBar(): Promise<void> {
	if (!progressBarMounted) {
		return
	}
	progressBarMounted = false
	await pluginFacade.renderManager.remove(progressBarId)
}