import { Widget } from './Widget'
import * as indexHtmlIds from './indexHtmlIds'
import { Map, map as mapWidget } from './Map'
import { ToolbarWidget } from './toolbars/ToolbarWidget'
import { renderManager } from './RenderManager'
import { settingsOnStartup } from './Settings'
import { util } from './util'

// TODO: rename to indexWidget|bodyWidget|appWidget|window(Widget)?

export let mainWidget: MainWidget

class MainWidget extends Widget {
    private map: Map|undefined
    //private terminal: TerminalWidget // TODO implement, or bottomBar?
    public readonly sidebar: ToolbarWidget

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
        const settings = await settingsOnStartup
        
        if (!this.renderedOrInProgress) {
            this.renderedOrInProgress = true
            settings.subscribeBoolean('sidebar', async (active: boolean) => this.render())
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
        const settings = await settingsOnStartup
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

}

mainWidget = new MainWidget()