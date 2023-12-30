import { RenderManager } from '../../dist/core/RenderManager'
import { RenderElementWithId, UltimateWidget } from '../../dist/core/Widget'
import { RenderElements, ToolbarView, renderManager } from '../../dist/pluginFacade'
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
                innerHTML: 'Git Ref: ',
                children: this.shapeInner()
            }
        }
    }

    private shapeInner(): RenderElements {
        return [
            {
                type: 'input',
                value: 'HEAD',
                id: 'git-ref-input'
            },
            {
                type: 'button',
                innerHTML: 'View Changes &#129668;',
                async onclick() {
                    visualizeCommitsByRef(await renderManager.getValueOf('git-ref-input'))
                }
            }
        ]
    }

    public override async render(): Promise<void> {
        await renderManager.setElementsTo(this.id, this.shapeInner())
    }

    public override async unrender(): Promise<void> {
        await renderManager.clearContentOf(this.id)
    }
}