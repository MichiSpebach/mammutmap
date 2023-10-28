import { renderManager } from './RenderManager';
import { Widget } from './Widget'
import { settings } from './settings/settings';
import { RenderElement, RenderElements, Style } from './util/RenderElement';

export class ToggleSidebarWidget /*extends Widget*/ {

	public constructor(
		public readonly id: string
	) {}

	public shape(additionalStyle?: Style): RenderElement {
		settings.subscribeBoolean('sidebar', () => this.render()) // TODO: ensure somehow that not called when not mounted
		return {
			type: 'button',
			id: this.id,
			style: {cursor: 'pointer', ...additionalStyle},
			onclick: () => settings.setBoolean('sidebar', !settings.getBoolean('sidebar')),
			children: this.shapeInner(),
			//onMount: () => settings.subscribeBoolean('sidebar', () => this.render()) // could miss a change that happens between calling shape and onMount
		}
	}

	private shapeInner(): RenderElements {
		return settings.getBoolean('sidebar') ? '>' : '<'
	}
	
	private render(): Promise<void> {
		//await this.mounting
		return renderManager.setElementsTo(this.id, this.shapeInner())
	}
	
}