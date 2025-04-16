import { PopupWidget } from '../../dist/core/PopupWidget'
import { util } from '../../dist/core/util/util'
import { Box, RenderElement, RenderElements } from '../../dist/pluginFacade'
import { PulledBox } from './PulledBox'
import { PulledBoxes } from './PulledBoxes'

export class DebugWidget extends PopupWidget {

	public static async newAndRenderFor(pulledBoxes: PulledBoxes): Promise<DebugWidget> {
		const widget = new DebugWidget(pulledBoxes)
		await widget.render()
		return widget
	}

	private constructor(private pulledBoxes: PulledBoxes) {
		super(`pulledBoxes-${util.generateId()}`, 'PulledBoxes')
	}

	protected override formContent(): RenderElements {
		return [
			...this.pulledBoxes.pulledBoxes.map(pulledBox => this.shapePulledBoxInfo(pulledBox)).flat(),
			{
				type: 'button',
				onclick: () => this.render(),
				children: 'update'
			}
		]
	}

	private shapePulledBoxInfo(box: PulledBox): (string|RenderElement)[] {
		return [
			`${box.box.getName()} (pullReasons: ${box.reasons.map(reason => reason.reason instanceof Box ? reason.reason.getName() : reason.reason.getId())})`,
			{
				type: 'div',
				style: {marginLeft: '16px'},
				children: box.pulledChildren.map(pulledChild => this.shapePulledBoxInfo(pulledChild)).flat()
			}
		]
	}
}