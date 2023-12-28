import { RenderElementWithId, UltimateWidget } from '../../dist/core/Widget'
import { ToolbarView, renderManager } from '../../dist/pluginFacade'
import { visualizeCommitsByRef } from './gitWitchcraft'

export class GitVisualizationToolbarView extends UltimateWidget implements ToolbarView {

    public constructor(
        public readonly id: string
    ) {
        super()
    }

    public getName(): string {
        return 'GitVisualization'
    }

    public getWidget(): UltimateWidget {
        return this
    }

    /**@deprecated simply use id field as it is readonly */
    public override getId(): string {
        return this.id
    }

    public override shape(): { element: RenderElementWithId; rendering?: Promise<void> | undefined } {
        return {
            element: {
                type: 'div',
                id: this.id,
                innerHTML: 'Git Ref: <input type="input" placeholder="HEAD">',
                onchangeValue(ref: string) {
                    visualizeCommitsByRef(ref)
                }
            }
        }
    }

    public override render(): Promise<void> {
        throw new Error('Method not implemented.')
    }

    public override async unrender(): Promise<void> {
        await renderManager.clearContentOf(this.id)
    }
}