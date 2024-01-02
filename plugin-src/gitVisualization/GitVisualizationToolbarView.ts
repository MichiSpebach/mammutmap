import { RenderElementWithId, UltimateWidget } from '../../dist/core/Widget'
import { RenderElement, RenderElements, ToolbarView, renderManager } from '../../dist/pluginFacade'
import { visualizeChanges } from './gitWitchcraft'

export class GitVisualizationToolbarView extends UltimateWidget implements ToolbarView {

    static isZoomingEnabled: boolean = true

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
                children: this.shapeInner()
            }
        }
    }

    private shapeInner(): RenderElements {
        return [
            this.shapeInputField('git-ref-input-from', 'HEAD^', 'Ref from: '),
            this.shapeInputField('git-ref-input-to', 'HEAD', 'Ref to: '),
            this.shapeToggle(),
            {
                type: 'button',
                innerHTML: 'View Changes &#129668;',
                async onclick() {
                    const fromRef: string = await renderManager.getValueOf('git-ref-input-from')
                    const toRef: string = await renderManager.getValueOf('git-ref-input-to')
                    visualizeChanges(fromRef, toRef, GitVisualizationToolbarView.isZoomingEnabled)
                }
            }
        ]
    }

    private shapeInputField(id: string, value: string, label: string): RenderElement {
        return {
            type: 'div',
            style: { display: 'block' },
            children: [
                {
                    type: 'span',
                    innerHTML: label
                },
                {
                    type: 'input',
                    value: value,
                    id: id
                }
            ]
        }
    }

    private shapeToggle(): RenderElement {
        return {
            type: 'div',
            style: { display: 'block' },
            children: [
                {
                    type: 'span',
                    innerHTML: 'Zoom To Changes?'
                },
                {
                    type: 'div',
                    style: { display: 'inline' },
                    innerHTML: '<input type="checkbox" checked>',
                    onchangeChecked: (value: boolean) => {
                        GitVisualizationToolbarView.isZoomingEnabled = value
                    }
                }
            ]
        }
    }

    public override async render(): Promise<void> {
        await renderManager.setElementsTo(this.id, this.shapeInner())
    }

    public override async unrender(): Promise<void> {
        await renderManager.clearContentOf(this.id)
    }
}