import { UltimateWidget } from '../../../dist/core/Widget'
import { coreUtil } from '../../../dist/pluginFacade'
import { ToolbarView } from '../../../dist/pluginFacade'
import { Widget } from '../../../dist/pluginFacade'
import { LinkAppearanceToolbarViewWidget } from './LinkAppearanceToolbarViewWidget'

export class LinkAppearanceToolbarView implements ToolbarView {

    private readonly widget: UltimateWidget

    public constructor(
        private readonly name: string
    ) {
        this.widget = new LinkAppearanceToolbarViewWidget(name+coreUtil.generateId())
    }

    public getName(): string {
        return this.name
    }

    public getWidget(): UltimateWidget {
        return this.widget
    }

}