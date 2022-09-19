import { util } from '../../../dist/util'
import { ToolbarView } from '../../../dist/toolbars/ToolbarView'
import { Widget } from '../../../dist/Widget'
import { LinkDidactorToolbarViewWidget } from './LinkDidactorToolbarViewWidget'

export class LinkDidactorToolbarView implements ToolbarView {

    private readonly widget: Widget

    public constructor(
        private readonly name: string
    ) {
        this.widget = new LinkDidactorToolbarViewWidget(name+util.generateId())
    }

    public getName(): string {
        return this.name
    }

    public getWidget(): Widget {
        return this.widget
    }

}