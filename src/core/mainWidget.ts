import { Widget } from './Widget'
import * as indexHtmlIds from './indexHtmlIds'
import { Map, map as mapWidget } from './Map'
import { ToolbarWidget } from './toolbars/ToolbarWidget'
import { renderManager } from './RenderManager'
import { settings } from './Settings'
import { util } from './util'
import { createElement } from './util/RenderElement'
import { ClientPosition } from './shape/ClientPosition'

// TODO: rename to indexWidget|bodyWidget|appWidget|window(Widget)?

export let mainWidget: MainWidget

class MainWidget extends Widget {
    private map: Map|undefined
    //private terminal: TerminalWidget // TODO implement, or bottomBar?
    public readonly sidebar: ToolbarWidget
    private devStatsInterval: NodeJS.Timer|undefined

    private renderedOrInProgress: boolean = false

    public constructor() {
        super()
        this.map = mapWidget
        this.sidebar = new ToolbarWidget('sidebar')
    }

    public getId(): string {
        return indexHtmlIds.bodyId
    }

    public async render(): Promise<void> {
        const pros: Promise<void>[] = []
        
        if (!this.renderedOrInProgress) {
            this.renderedOrInProgress = true
            settings.subscribeBoolean('sidebar', async (active: boolean) => this.render())
            settings.subscribeBoolean('developerMode', (newValue: boolean) => this.updateDevStats())
            this.updateDevStats()
            await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${this.sidebar.getId()}"></div>`)
        }
        
        if (settings.getBoolean('sidebar')) {
            pros.push(this.sidebar.render())
        } else {
            pros.push(this.sidebar.unrender())
        }

        pros.push(this.adjustWidgets())

        await Promise.all(pros)
    }

    public async unrender(): Promise<void> {
        util.logWarning('expected MainWidget::unrender not to be called') // TODO: add default implementation in super class?
    }

    private async adjustWidgets(): Promise<void> {
        if (settings.getBoolean('sidebar')) {
            await Promise.all([
                renderManager.setStyleTo(this.sidebar.getId(), 'position:absolute;top:0;right:0;height:100%;width:20%;background-color:#303438;'),
                renderManager.setStyleTo(indexHtmlIds.contentId, this.getContentStyle(80)),
                renderManager.setStyleTo(indexHtmlIds.terminalId, this.getTerminalStyle(80))
            ])
        } else {
            await Promise.all([
                renderManager.setStyleTo(this.sidebar.getId(), 'display:none;'),
                renderManager.setStyleTo(indexHtmlIds.contentId, this.getContentStyle(100)),
                renderManager.setStyleTo(indexHtmlIds.terminalId, this.getTerminalStyle(100))
            ])
        }
    }

    private getContentStyle(widthInPercent: number): string {
        return `width:${widthInPercent}%;height:85%;`
    }

    private getTerminalStyle(widthInPercent: number): string {
        return `width:${widthInPercent}%;height:15%;overflow-x:auto;`
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
            await renderManager.addElementTo(this.getId(), createElement('div', {
                id: devStatsId, 
                style: {position: 'absolute', top: '30px', left: '10px'}
            }, []))
        }

        const cursorPosition: ClientPosition = renderManager.getCursorClientPosition()
        await renderManager.setElementsTo(devStatsId, [
            createElement('div', {}, [`clientX = ${cursorPosition.x}`]),
            createElement('div', {}, [`clientY = ${cursorPosition.y}`])
        ])
    }

}

mainWidget = new MainWidget()