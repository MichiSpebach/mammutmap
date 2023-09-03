import { renderManager } from '../RenderManager'
import { Widget } from '../Widget'
import { log } from '../logService'
import { RenderElement, RenderElements, Style } from '../util/RenderElement'
import { Box } from './Box'

type BoxTab = {
    name: string,
    isAvailableFor: (box: Box) => boolean|Promise<boolean>,
    buildWidget: (box: Box) => RenderElements|Widget|Promise<RenderElements|Widget>
}

class BoxTabBarWidget extends Widget {
    private someTabRendered: boolean = false
    private selectedTab: 'map'|BoxTab = 'map'

    public constructor(
        private readonly id: string,
        private readonly parent: BoxTabs,
        private readonly onSelect: (tab: 'map'|BoxTab) => Promise<void>
    ) {
        super()
    }

    public override getId(): string {
        return this.id
    }

    public override async render(): Promise<void> {
        if (this.someTabRendered) {
            log.warning('BoxTabBarWidget::render() already rendered.')
            return
        }
        const pros: Promise<void>[] = BoxTabs.registeredTabs.map(tab => this.renderTab(tab))
        await Promise.all(pros)
    }

    public override async unrender(): Promise<void> {
        if (!this.someTabRendered) {
            return
        }
        this.someTabRendered = false
        await renderManager.clearContentOf(this.getId())
    }

    private getTabId(tab: 'map'|BoxTab): string {
        return tab === 'map'
            ? this.getId()+'Map'
            : this.getId()+tab.name
    }

    private async renderTab(tab: BoxTab): Promise<void> {
        if (!await tab.isAvailableFor(this.parent.referenceBox)) {
            return
        }

        const tabElement: RenderElement = {
            type: 'button',
            id: this.getTabId(tab),
            style: this.getTabStyle(tab),
            onclick: () => this.select(tab),
            children: tab.name
        }
        if (this.someTabRendered) {
            await renderManager.addElementTo(this.getId(), tabElement)
        } else {
            this.someTabRendered = true
            const defaultMapTabElement: RenderElement = {
                type: 'button',
                id: this.getTabId('map'),
                style: this.getTabStyle('map'),
                onclick: () => this.select('map'),
                children: 'Map'
            }
            await renderManager.addElementsTo(this.getId(), [defaultMapTabElement, tabElement])
        }
    }

    private getTabStyle(tab: 'map'|BoxTab): Style {
        let style: Style = {
            padding: '4px 8px',
            fontSize: 'inherit',
            color: 'inherit',
            backgroundColor: '#222',
            border: 'none',
            borderRight: '1px solid gray',
            borderBottom: '1px solid gray',
            cursor: 'pointer'
        }
        if (this.selectedTab === tab) {
            style = {
                ...style,
                backgroundColor: 'transparent',
                borderBottom: 'none'
            }
        }
        return style
    }

    private async select(tab: 'map'|BoxTab): Promise<void> {
        const oldSelectedTab: 'map'|BoxTab = this.selectedTab
        this.selectedTab = tab
        await Promise.all([
            renderManager.setStyleTo(this.getTabId(oldSelectedTab), this.getTabStyle(oldSelectedTab)),
            renderManager.setStyleTo(this.getTabId(this.selectedTab), this.getTabStyle(this.selectedTab)),
            this.onSelect(tab)
        ])
    }

    public shapeFormOuter(): RenderElement {
        return {
            type: 'div',
            id: this.getId()
        }
    }

}

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
                style: {
                    backgroundColor: '#002040e0'
                },
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
            return this.clearContent()
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
        const rendering: Promise<void> = renderManager.addElementTo(this.getId(), {
            type: 'div',
            id: this.getContentId(),
            style: {
                padding: '0px 5px 5px 5px'
            },
            children: tabContent
        })
        if (contentWidget) {
            await contentWidget.render()
        }
        await rendering
    }

    private async clearContent(): Promise<void> {
        if (!this.contentRendered) {
            return
        }
        this.contentRendered = false
        return renderManager.remove(this.getContentId())
    }

}