import { renderManager } from '../../renderEngine/renderManager';
import { Widget } from '../../Widget';
import { log } from '../../logService';
import { RenderElement, Style } from '../../renderEngine/RenderElement';
import { BoxTabs } from './BoxTabs';
import { BoxTab } from './BoxTab';
import { ToolbarWidget } from '../../toolbars/ToolbarWidget';

export class BoxTabBarWidget extends Widget {
	private someTabRendered: boolean = false;
	private selectedTab: 'map' | BoxTab = 'map';

	public constructor(
		public readonly id: string,
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
		const ongoing: Promise<void>[] = []

		const tabElement: RenderElement = {
			type: 'button',
			id: this.getTabId(tab),
			style: this.getTabStyle(tab),
			onclick: () => this.select(tab),
			children: tab.name
		};
		if (this.someTabRendered) {
			ongoing.push(renderManager.addElementTo(this.getId(), tabElement))
		} else {
			this.someTabRendered = true;
			const defaultMapTabElement: RenderElement = {
				type: 'button',
				id: this.getTabId('map'),
				style: this.getTabStyle('map'),
				onclick: () => this.select('map'),
				children: 'Map'
			};
			ongoing.push(renderManager.addElementsTo(this.getId(), [defaultMapTabElement, tabElement]))
		}

		if (tab.isDefaultSelectedFor && await tab.isDefaultSelectedFor(this.parent.referenceBox)) {
			ongoing.push(this.select(tab))
		}

		await Promise.all(ongoing)
	}

	private getTabStyle(tab: 'map' | BoxTab): Style {
		return ToolbarWidget.getHeaderButtonStyle(this.selectedTab === tab, {
			visibility: (tab === 'map' && this.selectedTab === tab) ? 'hidden' : null // reset visibility with null in case it is 'hidden'
		});
	}

	private async select(tab: 'map' | BoxTab): Promise<void> {
		const oldSelectedTab: 'map' | BoxTab = this.selectedTab;
		this.selectedTab = tab;
		await Promise.all([
			renderManager.addStyleTo(this.getTabId(oldSelectedTab), this.getTabStyle(oldSelectedTab)),
			renderManager.addStyleTo(this.getTabId(this.selectedTab), this.getTabStyle(this.selectedTab)),
			this.onSelect(tab)
		]);
	}

	public shapeOuter(): RenderElement {
		return {
			type: 'div',
			id: this.getId()
		};
	}

}
