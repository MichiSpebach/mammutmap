import { renderManager } from '../../RenderManager';
import { Widget } from '../../Widget';
import { log } from '../../logService';
import { RenderElement, Style } from '../../util/RenderElement';
import { BoxTabs } from './BoxTabs';
import { BoxTab } from './BoxTab';

export class BoxTabBarWidget extends Widget {
    private someTabRendered: boolean = false;
    private selectedTab: 'map' | BoxTab = 'map';

    public constructor(
        private readonly id: string,
        private readonly parent: BoxTabs,
        private readonly onSelect: (tab: 'map' | BoxTab) => Promise<void>
    ) {
        super();
    }

    public override getId(): string {
        return this.id;
    }

    public override async render(): Promise<void> {
        if (this.someTabRendered) {
            log.warning('BoxTabBarWidget::render() already rendered.');
            return;
        }
        const pros: Promise<void>[] = BoxTabs.registeredTabs.map(tab => this.renderTab(tab));
        await Promise.all(pros);
    }

    public override async unrender(): Promise<void> {
        if (!this.someTabRendered) {
            return;
        }
        this.someTabRendered = false;
        await renderManager.clearContentOf(this.getId());
    }

    private getTabId(tab: 'map' | BoxTab): string {
        return tab === 'map'
            ? this.getId() + 'Map'
            : this.getId() + tab.name;
    }

    private async renderTab(tab: BoxTab): Promise<void> {
        if (!await tab.isAvailableFor(this.parent.referenceBox)) {
            return;
        }

        const tabElement: RenderElement = {
            type: 'button',
            id: this.getTabId(tab),
            style: this.getTabStyle(tab),
            onclick: () => this.select(tab),
            children: tab.name
        };
        if (this.someTabRendered) {
            await renderManager.addElementTo(this.getId(), tabElement);
        } else {
            this.someTabRendered = true;
            const defaultMapTabElement: RenderElement = {
                type: 'button',
                id: this.getTabId('map'),
                style: this.getTabStyle('map'),
                onclick: () => this.select('map'),
                children: 'Map'
            };
            await renderManager.addElementsTo(this.getId(), [defaultMapTabElement, tabElement]);
        }
    }

    private getTabStyle(tab: 'map' | BoxTab): Style {
        let style: Style = {
            padding: '4px 8px',
            fontSize: 'inherit',
            color: 'inherit',
            backgroundColor: '#222',
            border: 'none',
            borderRight: '1px solid gray',
            borderBottom: '1px solid gray',
            cursor: 'pointer'
        };
        if (this.selectedTab === tab) {
            style = {
                ...style,
                backgroundColor: 'transparent',
                borderBottom: 'none'
            };
        }
        return style;
    }

    private async select(tab: 'map' | BoxTab): Promise<void> {
        const oldSelectedTab: 'map' | BoxTab = this.selectedTab;
        this.selectedTab = tab;
        await Promise.all([
            renderManager.setStyleTo(this.getTabId(oldSelectedTab), this.getTabStyle(oldSelectedTab)),
            renderManager.setStyleTo(this.getTabId(this.selectedTab), this.getTabStyle(this.selectedTab)),
            //this.onSelect(tab) must not be in same batch as setStyleTo(..) because of bug in domAdapter TODO: fix this bug
        ]);
        await this.onSelect(tab)
    }

    public shapeFormOuter(): RenderElement {
        return {
            type: 'div',
            id: this.getId()
        };
    }

}
