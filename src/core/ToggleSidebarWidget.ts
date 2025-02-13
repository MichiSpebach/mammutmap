import { renderManager } from './renderEngine/renderManager';
import { Widget } from './Widget'
import { log } from './logService';
import { settings } from './settings/settings';
import { RenderElement, RenderElements, Style } from './renderEngine/RenderElement';

export class ToggleSidebarWidget /*extends Widget*/ {

	private readonly onSettingChange: (newValue: boolean) => Promise<void> = () => this.render()

	public constructor(
		public readonly id: string,
		public readonly setting: 'sidebar'|'boxSidebar'
	) {}

	public shape(additionalStyle?: Style): RenderElement {
		settings.subscribeBoolean(this.setting, this.onSettingChange) // TODO: ensure somehow that not called when not mounted
		return {
			type: 'button',
			id: this.id,
			style: {cursor: 'pointer', ...additionalStyle},
			onclick: () => settings.setBoolean(this.setting, !settings.getBoolean(this.setting)),
			children: this.shapeInner(),
			//onMount: () => settings.subscribeBoolean(this.setting, this.onSettingChange) // could miss a change that happens between calling shape and onMount
			//onUnmount: () => settings.unsubscribeBoolean(this.setting, this.onSettingChange)
		}
	}

	/** TODO: can be removed as soon as onUnmount is part of RenderElement */
	public onUnmount(): void {
		settings.unsubscribeBoolean(this.setting, this.onSettingChange)
	}

	private shapeInner(): RenderElements {
		return settings.getBoolean(this.setting) ? this.getTrueText() : this.getFalseText()
	}

	private getTrueText(): string {
		switch (this.setting) {
			case 'sidebar':
				return '>'
			case 'boxSidebar':
				return '<'
			default:
				log.warning(`ToggleSidebarWidget::getTrueText() not implemented for '${this.setting}', defaulting to 'currently true'.`)
				return 'currently true'
		}
	}

	private getFalseText(): string {
		switch (this.setting) {
			case 'sidebar':
				return '<'
			case 'boxSidebar':
				return '>'
			default:
				log.warning(`ToggleSidebarWidget::getFalseText() not implemented for '${this.setting}', defaulting to 'currently false'.`)
				return 'currently false'
		}
	}
	
	private render(): Promise<void> {
		//await this.mounting
		return renderManager.setElementsTo(this.id, this.shapeInner())
	}
	
}