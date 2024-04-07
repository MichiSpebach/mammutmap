import { Box, BoxDepthTreeIterator, FolderBox, Link, MenuItemFile, PopupWidget, ProgressBarWidget, RenderElement, contextMenu, coreUtil, renderManager } from '../dist/pluginFacade'

contextMenu.addFileBoxMenuItem(buildItemForContextMenu)
contextMenu.addFolderBoxMenuItem(buildItemForContextMenu)
contextMenu.addSourcelessBoxMenuItem(buildItemForContextMenu)

Box.Sidebar.BasicToolkit.add({
	topic: 'links',
	indexWithinTopic: 3,
	build: (box: Box) => Box.Sidebar.BasicToolkit.buildButton('remove links...', () => openDialogForRemoveLinks(box))
})

function buildItemForContextMenu(box: Box): MenuItemFile {
	return new MenuItemFile({label: 'remove links...', click: () => openDialogForRemoveLinks(box)})
}

async function openDialogForRemoveLinks(box: Box): Promise<void> {
	const modeGroupId: string = coreUtil.generateId()
	const modeAllId: string = coreUtil.generateId()
	const modeAutoMaintainedId: string = coreUtil.generateId()
	const managedLinksId: string = coreUtil.generateId()
	const outgoingLinksId: string = coreUtil.generateId()
	const recursivelyId: string = coreUtil.generateId()
	const pathsToIgnoreId: string = coreUtil.generateId()
	const content: RenderElement[] = [
		{
			type: 'div',
			innerHTML: `<input type="radio" id="${modeAutoMaintainedId}" name="${modeGroupId}" checked><label for="${modeAutoMaintainedId}">autoMaintained</label>`
		},
		{
			type: 'div',
			innerHTML: `<input type="radio" id="${modeAllId}" name="${modeGroupId}"><label for="${modeAllId}">all</label>`
		},
		{
			type: 'div',
			innerHTML: `<input type="checkbox" id="${outgoingLinksId}" checked><label for="${outgoingLinksId}">outgoing</label>`
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
		children: 'Remove',
		onclick: async () => {
			removeLinks(box, await promiseAllOfObject({
				mode: renderManager.getCheckedOf(modeAllId).then(modeAllChecked => modeAllChecked ? 'all' : 'autoMaintained'), 
				outgoing: renderManager.getCheckedOf(outgoingLinksId),
				managed: renderManager.getCheckedOf(managedLinksId),
				recursively: boxIsFolder ? renderManager.getCheckedOf(recursivelyId) : false,
				pathsToIgnoreIfRecursively: boxIsFolder ? renderManager.getValueOf(pathsToIgnoreId).then(pathsToIgnore => pathsToIgnore.split(',').map(path => path.trim())) : []
			}))
			popup.unrender()
		}
	})
	const popup: PopupWidget = await PopupWidget.newAndRender({title: `Remove Links of '${box.getName()}'`, content})
}

// add to coreUtil?
export async function promiseAllOfObject<T extends Object>(obj: T): Promise<{
	[key in keyof T]: Awaited<T[key]>
}> {
	const entries = Object.entries(obj).map(async ([key, value]) => [key, await value])
	return Object.fromEntries(await Promise.all(entries))
}

async function removeLinks(startBox: Box, options: {
	mode: 'all'|'autoMaintained'
	outgoing: boolean
	managed: boolean
	recursively: boolean
	pathsToIgnoreIfRecursively: string[]
}): Promise<void> {
	console.info(`Start removing links of '${startBox.getSrcPath()}' with options '${JSON.stringify(options)}'...`)
	const progressBar: ProgressBarWidget = await ProgressBarWidget.newAndRenderInMainWidget()
	let processedBoxCount: number = 0
	let foundLinksCount: number = 0
	let removedLinksCount: number = 0
	const pros: Promise<void>[] = []

	if (options.outgoing) {
		pros.push(removeLinksRegardingOptions(startBox.borderingLinks.getOutgoing(), 0.5))
	}
	if (options.managed) {
		pros.push(removeLinksRegardingOptions(startBox.links.getLinks(), 0.5))
	}
	if (options.recursively && startBox instanceof FolderBox) {
		const boxIterator = new BoxDepthTreeIterator(startBox, {srcPathsToIgnore: options.pathsToIgnoreIfRecursively})
		while(await boxIterator.hasNextOrUnwatch()) {
			const nextBox: Box = await boxIterator.next()
			if (nextBox === startBox) {
				continue
			}
			pros.push(removeLinksRegardingOptions(nextBox.links.getLinks(), 1))
			
		}
	}

	await Promise.all(pros)
	await progressBar.finishAndRemove()
	console.log(`Finished ${buildProgressText()}.`)

	async function removeLinksRegardingOptions(links: Link[], boxCount: number): Promise<void> {
		foundLinksCount += links.length
		progressBar.set({text: buildProgressText()})
		links = [...links] // copy array because concurrently removing elements while iterating over it would lead to skips (Array::map() is index based)
		await Promise.all(links.map(removeLinkRegardingOptions))
		processedBoxCount += boxCount
		progressBar.set({text: buildProgressText()})
	}

	async function removeLinkRegardingOptions(link: Link): Promise<void> {
		if (options.mode !== 'all' && !link.isAutoMaintained()) {
			return
		}
		await link.getManagingBoxLinks().removeLink(link, 'remove')
		removedLinksCount++
		progressBar.set({text: buildProgressText()})
	}

	function buildProgressText(): string {
		return `removing links: analyzed ${processedBoxCount} boxes, found ${foundLinksCount} links, removed ${removedLinksCount} of them`
	}
}