import { Box, FolderBox, PopupWidget, RenderElement, coreUtil, renderManager } from '../../dist/pluginFacade'
import * as boxIterator from './boxIterator'

export async function openDialogForBundleLinks(box: Box): Promise<void> {
	const modeGroupId: string = coreUtil.generateId()
	const modeAutoMaintainedId: string = coreUtil.generateId()
	const modeAllId: string = coreUtil.generateId()
	const borderingLinksId: string = coreUtil.generateId()
	const managedLinksId: string = coreUtil.generateId()
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
			boxIterator.bundleLinks(box, await promiseAllOfObject({
				mode: renderManager.getCheckedOf(modeAllId).then(modeAllChecked => modeAllChecked ? 'all' : 'autoMaintained'), 
				bordering: renderManager.getCheckedOf(borderingLinksId),
				managed: renderManager.getCheckedOf(managedLinksId),
				recursively: boxIsFolder ? renderManager.getCheckedOf(recursivelyId) : false,
				pathsToIgnoreIfRecursively: boxIsFolder
					? renderManager.getValueOf(pathsToIgnoreId).then(pathsToIgnore => pathsToIgnore.split(',').map(path => coreUtil.concatPaths(box.getSrcPath(), path.trim())))
					: []
			}))
			popup.unrender()
		}
	})
	const popup: PopupWidget = await PopupWidget.newAndRender({title: `Bundle Links of '${box.getName()}'`, content})
}

// add to coreUtil?
export async function promiseAllOfObject<T extends Object>(obj: T): Promise<{
	[key in keyof T]: Awaited<T[key]>
}> {
	const entries = Object.entries(obj).map(async ([key, value]) => [key, await value])
	return Object.fromEntries(await Promise.all(entries))
}