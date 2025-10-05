import { Link, coreUtil } from '../../src/pluginFacade'
import * as pluginFacade from '../../src/pluginFacade'
import * as bundler from './bundler'

const queue: {linkId: string, managingBoxSrcPath: string}[] = []
let processing: boolean = false

export function scheduleBundleLink(link: Link): void {
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