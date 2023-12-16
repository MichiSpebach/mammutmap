import { Box, BoxDepthTreeIterator, FolderBox, Link, MenuItem, MenuItemFile, MenuItemFolder, PopupWidget, ProgressBarWidget, RenderElement, contextMenu } from '../dist/pluginFacade'

contextMenu.addFileBoxMenuItem(buildItemsForContextMenu)
contextMenu.addFolderBoxMenuItem(buildItemsForContextMenu)
contextMenu.addSourcelessBoxMenuItem(buildItemsForContextMenu)

Box.Sidebar.BasicToolkit.addGroup({
	title: 'Remove Outgoing Links',
	color: 'red',
	item: {
		topic: 'links',
		indexWithinTopic: 2,
		build: buildElementsForBoxSidebar
	}
})

function buildItemsForContextMenu(box: Box): MenuItemFolder {
	const suffixIfFolder: string = box instanceof FolderBox ? ' of this folder' : ''
	const items: MenuItem[] = [
		new MenuItemFile({label: 'autoMaintained'+suffixIfFolder, click: () => {
			box.borderingLinks.getOutgoing().filter(link => link.isAutoMaintained()).forEach(link => link.getManagingBoxLinks().removeLink(link))
		}}),
		new MenuItemFile({label: 'all'+suffixIfFolder, click: () => {
			box.borderingLinks.getOutgoing().forEach(link => link.getManagingBoxLinks().removeLink(link))
		}}),
	]
	if (box instanceof FolderBox) {
		items.push(new MenuItemFile({label: 'autoMaintained recursively...', click: () => {
			openDialogForRemoveOutgoingLinksRecursively(box, 'AutoMaintained')
		}}))
		items.push(new MenuItemFile({label: 'all recursively...', click: () => {
			openDialogForRemoveOutgoingLinksRecursively(box, 'All')
		}}))
	}
	return new MenuItemFolder({label: 'remove outgoing links', submenu: items})
}

function buildElementsForBoxSidebar(box: Box): (string|RenderElement)[] {
	const suffixIfFolder: string = box instanceof FolderBox ? ' of this folder' : ''
	const elements: (string|RenderElement)[] = []
	elements.push(Box.Sidebar.BasicToolkit.buildButton('autoMaintained'+suffixIfFolder, 
		() => box.borderingLinks.getOutgoing().filter(link => link.isAutoMaintained()).forEach(link => link.getManagingBoxLinks().removeLink(link))
	))
	elements.push(Box.Sidebar.BasicToolkit.buildButton('all'+suffixIfFolder, 
		() => box.borderingLinks.getOutgoing().filter(link => link.isAutoMaintained()).forEach(link => link.getManagingBoxLinks().removeLink(link))
	))
	if (box instanceof FolderBox) {
		elements.push(Box.Sidebar.BasicToolkit.buildButton('autoMaintained recursively...', () => openDialogForRemoveOutgoingLinksRecursively(box, 'AutoMaintained')))
		elements.push(Box.Sidebar.BasicToolkit.buildButton('all recursively...', () => openDialogForRemoveOutgoingLinksRecursively(box, 'All')))
	}
	return elements
}

async function openDialogForRemoveOutgoingLinksRecursively(folder: FolderBox, mode: 'All'|'AutoMaintained'): Promise<void> {
	const popup: PopupWidget = await PopupWidget.newAndRender({title: `Remove ${mode} Outgoing Links Recursively`, content: [
		{
			type: 'div',
			style: {marginTop: '4px', marginBottom: '4px'},
			children: 'Are you sure? This may take a while (depending on how many files there are).'},
		{
			type: 'button',
			children: 'Yes',
			onclick: () => {
				removeOutgoingLinksRecursively(folder, mode)
				popup.unrender()
			}
		}
	]})
}

async function removeOutgoingLinksRecursively(box: FolderBox, mode: 'All'|'AutoMaintained'): Promise<void> {
	console.log(`Start removing ${mode} outgoing links recursively of '${box.getSrcPath()}'...`)
	const progressBar: ProgressBarWidget = await ProgressBarWidget.newAndRenderInMainWidget()
	const boxIterator = new BoxDepthTreeIterator(box)
	let fileCount: number = 0
	let foundLinksCount: number = 0
	let removedLinksCount: number = 0
	const pros: Promise<void>[] = []

	while(await boxIterator.hasNextOrUnwatch()) {
		const box: Box = await boxIterator.next()
		fileCount++
		let links: Link[] = box.borderingLinks.getOutgoing()
		foundLinksCount += links.length
		progressBar.set({text: buildProgressText()})
		if (mode === 'AutoMaintained') {
			links = links.filter(link => link.isAutoMaintained())
		}
		pros.push(...links.map(async link => {
			await link.getManagingBoxLinks().removeLink(link)
			removedLinksCount++
			progressBar.set({text: buildProgressText()})
		}))
	}
	
	await Promise.all(pros)
	await progressBar.finishAndRemove()
	console.log(`Finished ${buildProgressText()}.`)

	function buildProgressText(): string {
		return `removing ${mode} outgoing links recursively: analyzed ${fileCount} files, found ${foundLinksCount} links, removed ${removedLinksCount} of them`
	}
}