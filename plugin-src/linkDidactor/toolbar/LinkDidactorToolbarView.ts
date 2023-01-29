import { coreUtil } from '../../../dist/pluginFacade'
import { ToolbarView } from '../../../dist/pluginFacade'
import { Widget } from '../../../dist/pluginFacade'
import { LinkDidactorToolbarViewWidget } from './LinkDidactorToolbarViewWidget'

export class LinkDidactorToolbarView implements ToolbarView {

    private readonly widget: Widget

    public constructor(
        private readonly name: string
    ) {
        this.widget = new LinkDidactorToolbarViewWidget(name+coreUtil.generateId())
    }

    public getName(): string {
        return this.name
    }

    public getWidget(): Widget {
        return this.widget
    }

}