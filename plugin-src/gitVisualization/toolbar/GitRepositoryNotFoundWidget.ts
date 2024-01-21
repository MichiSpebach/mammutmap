import { RenderElementWithId, UltimateWidget } from '../../../dist/core/Widget';
import { RenderElements, renderManager } from '../../../dist/pluginFacade';

export class GitRepositoryNotFoundWidget extends UltimateWidget {

    public constructor(
        public readonly id: string,
        public readonly message: string
    ) {
        super()
    }

    /**@deprecated simply use id field as it is readonly */
    public override getId(): string {
        return this.id
    }

    public override shape(): { element: RenderElementWithId; rendering?: Promise<void> | undefined } {
        return {
            element: {
                type: 'div',
                id: this.id
            },
            rendering: this.render()
        }
    }

    public override async render(): Promise<void> {
        await renderManager.setElementsTo(this.id, await this.shapeInner())
    }

    private async shapeInner(): Promise<RenderElements> {
        return this.message
    }

    public override async unrender(): Promise<void> {
        await renderManager.clearContentOf(this.id)
    }
}