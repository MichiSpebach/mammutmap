import { renderManager } from '../../RenderManager'
import { Widget } from '../../Widget'
import { log } from '../../logService'
import { RenderElements } from '../../util/RenderElement'
import { Box } from '../Box'
import { BoxTab } from './BoxTab'
import { BoxTabBarWidget } from './BoxTabBarWidget'

export class BoxTabs {
	public static readonly registeredTabs: BoxTab[] = []

	private readonly bar: BoxTabBarWidget
	private rendered: boolean = false
	private contentRendered: boolean = false

	public static register(tab: BoxTab): void {
		if (this.registeredTabs.includes(tab)) {
			log.warning(`BoxTabs.register('${tab.name}') already registered.`)
		}
		this.registeredTabs.push(tab)
	}

	public static unregister(tab: BoxTab): void {
		const index: number = this.registeredTabs.indexOf(tab)
		if (index < 0) {
			log.warning(`BoxTabs.unregister('${tab.name}') not registered.`)
			return
		}
		this.registeredTabs.splice(index, 1)
	}

	public constructor(
		public readonly referenceBox: Box
	) {
		this.bar = new BoxTabBarWidget(this.getId()+'-bar', this, (tab: 'map'|BoxTab) => this.setContent(tab))
	}

	private getId(): string {
		return this.referenceBox.getId()+'Tabs'
	}

	private getContentId(): string {
		return this.getId()+'Content'
	}

	public async renderBar(): Promise<void> {
		const ongoing: Promise<void>[] = []
		if (!this.rendered) {
			this.rendered = true
			ongoing.push(renderManager.addElementTo(this.referenceBox.header.getId(), {
				type: 'div',
				id: this.getId(),
				children: this.bar.shapeFormOuter()
			}))
		}
		ongoing.push(this.bar.render())
		await Promise.all(ongoing)
	}

	public async unrenderBar(): Promise<void> {
		this.bar.unrender()
	}

	private async setContent(tab: 'map'|BoxTab): Promise<void> {
		if (tab === 'map') {
			await Promise.all([
				this.referenceBox.showContentIfRendered(),
				this.clearContent()
			])
			return
		}

		let tabContent: RenderElements|Widget = await tab.buildWidget(this.referenceBox)
		let contentWidget: Widget|undefined = undefined
		if (tabContent instanceof Widget) {
			contentWidget = tabContent
			tabContent = {
				type: 'div',
				id: contentWidget.getId()
			}
		}

		if (this.contentRendered) {
			return renderManager.setElementsTo(this.getContentId(), tabContent)
		}
		
		this.contentRendered = true
		const ongoing: Promise<void>[] = []
		ongoing.push(renderManager.addElementTo(this.getId(), {
			type: 'div',
			id: this.getContentId(),
			style: {
				padding: '0px 5px 5px 5px'
			},
			children: tabContent
		}))
		if (contentWidget) {
			ongoing.push(contentWidget.render())
		}
		ongoing.push(this.referenceBox.hideContentIfRendered())
		await Promise.all(ongoing)
	}

	private async clearContent(): Promise<void> {
		if (!this.contentRendered) {
			return
		}
		this.contentRendered = false
		return renderManager.remove(this.getContentId())
	}

}