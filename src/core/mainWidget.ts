import { Widget } from './Widget'
import * as indexHtmlIds from './indexHtmlIds'
import { Map, map as mapWidget } from './Map'
import { ToolbarWidget } from './toolbars/ToolbarWidget'
import { renderManager } from './RenderManager'
import { settings } from './settings/settings'
import { ClientPosition } from './shape/ClientPosition'
import { RenderElement, Style } from './util/RenderElement'
import { TerminalWidget } from './TerminalWidget'
import { ToggleSidebarWidget } from './ToggleSidebarWidget'
import { log } from './logService'

// TODO: rename to indexWidget|bodyWidget|appWidget|window(Widget)?

export let mainWidget: MainWidget

class MainWidget extends Widget {
	public readonly sidebar: ToolbarWidget
	public readonly toggleSidebarButton: ToggleSidebarWidget
	public readonly bottomBar: ToolbarWidget
	public readonly terminal: TerminalWidget
	private footer: {elementOrWidget: RenderElement/*|Widget TODO*/, heightInPixel: number, rendered: boolean} | undefined
	private map: Map|undefined
	private hovered: boolean = false
	private devStatsInterval: NodeJS.Timer|undefined

	private renderedOrInProgress: boolean = false

	public constructor() {
		super()
		this.map = mapWidget
		this.sidebar = new ToolbarWidget('sidebar')
		this.toggleSidebarButton = new ToggleSidebarWidget(`${this.getId()}-toggleSidebar`)
		this.bottomBar = new ToolbarWidget('bottomBar', {hideHeader: true})
		this.terminal = new TerminalWidget(this.bottomBar.getId()+'-terminal')
		this.bottomBar.addView({
			getName: () => 'Terminal',
			getWidget: () => this.terminal
		})
	}

	public getId(): string {
		return indexHtmlIds.bodyId
	}

	public async setFooter(elementOrWidget: RenderElement/*|Widget TODO*/, heightInPixel: number): Promise<void> {
		if (this.footer) {
			log.warning('footer already set')
		}
		this.footer = {elementOrWidget, heightInPixel, rendered: false}
		await this.render()
	}

	public async render(): Promise<void> {
		const pros: Promise<void>[] = []

		const sidebarEnabled: boolean = settings.getBoolean('sidebar')
		const transparentBottomBar: boolean = settings.getBoolean('transparentBottomBar')
		const sidebarDisplay: Style['display'] = sidebarEnabled ? null : 'none'
		const sidebarHeight: Style['height'] = this.footer ? `calc(100% - ${this.footer.heightInPixel}px)` : '100%'
		const contentWidth: Style['width'] = sidebarEnabled ? '80%' : '100%'
		const contentHeight: Style['height'] = transparentBottomBar ? '100%' : '85%'
		const bottomBarWidth: Style['width'] = sidebarEnabled ? '80%' : '100%'
		const bottomBarHeight: Style['height'] = this.footer ? `calc(15% - ${this.footer.heightInPixel}px)` : '15%'
		const bottomBarBottom: Style['bottom'] = this.footer ? `${this.footer.heightInPixel}px` : '0'
		const bottomBarBackgroundColor: Style['backgroundColor'] = transparentBottomBar && !this.hovered ? null : '#202428'
		
		if (!this.renderedOrInProgress) {
			this.renderedOrInProgress = true
			settings.subscribeBoolean('sidebar', async (active: boolean) => this.render())
			settings.subscribeBoolean('transparentBottomBar', async (checked: boolean) => this.render())
			settings.subscribeBoolean('developerMode', (newValue: boolean) => this.updateDevStats())
			this.updateDevStats()
			await Promise.all([
				renderManager.addStyleTo(indexHtmlIds.contentId, {width: contentWidth, height: contentHeight}), // TODO: add content as element as well instead of in index.html
				renderManager.addElementsTo(indexHtmlIds.bodyId, [
					this.sidebar.shapeOuter({
						display: sidebarDisplay,
						position: 'absolute',
						top: '0',
						right: '0',
						width:'20%',
						height: sidebarHeight,
						backgroundColor: '#303438'
					}),
					this.bottomBar.shapeOuter({
						position: 'absolute',
						bottom: bottomBarBottom,
						width: bottomBarWidth,
						height: bottomBarHeight,
						backgroundColor: bottomBarBackgroundColor,
						overflow: 'auto',
						transition: 'background-color 0.2s'
					}),
					this.toggleSidebarButton.shape({
						position: 'absolute', 
						top: '0', 
						right: '0'
					})
				])
			])
			pros.push(this.bottomBar.render())
			pros.push(renderManager.addEventListenerTo(this.bottomBar.getId(), 'mouseenter', () => {
				this.hovered = true
				this.render()
			}))
			pros.push(renderManager.addEventListenerTo(this.bottomBar.getId(), 'mouseleave', () => {
				this.hovered = false
				this.render()
			}))
		} else {
			pros.push(renderManager.addStyleTo(indexHtmlIds.contentId, {width: contentWidth, height: contentHeight}))
			pros.push(renderManager.addStyleTo(this.bottomBar.getId(), {width: bottomBarWidth, height: bottomBarHeight, bottom: bottomBarBottom, backgroundColor: bottomBarBackgroundColor}))
			pros.push(renderManager.addStyleTo(this.sidebar.getId(), {display: sidebarDisplay, height: sidebarHeight}))
		}
		
		if (sidebarEnabled) {
			pros.push(this.sidebar.render())
		} else {
			pros.push(this.sidebar.unrender())
		}

		if (this.footer && !this.footer.rendered) {
			this.footer.elementOrWidget.style = {
				...this.footer.elementOrWidget.style,
				position: 'absolute',
				bottom: '0px'
			}
			pros.push(renderManager.addElementTo(this.getId(), this.footer.elementOrWidget))
			this.footer.rendered = true
		}

		await Promise.all(pros)
	}

	public async unrender(): Promise<void> {
		log.warning('expected MainWidget::unrender not to be called') // TODO: add default implementation in super class?
	}

	private async updateDevStats(): Promise<void> {
		const devStatsId: string = this.getId()+'devStats'

		if (!settings.getBoolean('developerMode')) {
			if (this.devStatsInterval) {
				clearInterval(this.devStatsInterval)
				this.devStatsInterval = undefined
				await renderManager.remove(devStatsId)
			}
			return
		}

		if (!this.devStatsInterval) {
			this.devStatsInterval = setInterval(() => this.updateDevStats(), 200)
			await renderManager.addElementTo(this.getId(), {
				type: 'div',
				id: devStatsId, 
				style: {position: 'absolute', top: '50px', left: '10px'},
				children: []
			})
		}

		const cursorPosition: ClientPosition = renderManager.getCursorClientPosition()
		await renderManager.setElementsTo(devStatsId, [
			{type: 'div', children: `clientX = ${cursorPosition.x}`},
			{type: 'div', children: `clientY = ${cursorPosition.y}`}
		])
	}

}

mainWidget = new MainWidget()