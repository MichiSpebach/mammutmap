import { renderManager } from './RenderManager'
import { RenderElement, RenderElements } from './util/RenderElement'

// TODO move into util folder
// TODO rename to RenderingWidget and introduce (Simple)Widget with formHtml() method that does not need to know renderManager
// TODO all gui components should inherit this (Box, BoxHeader, BoxBody, Link, LinkEnd, ...)
export abstract class Widget {
    public abstract getId(): string
    public abstract render(): Promise<void> // TODO for some gui components render needs arguments
    public abstract unrender(): Promise<void>  // TODO: add default implementation?
}

export abstract class SimpleWidget extends Widget {
    public async render(): Promise<void> {
        await renderManager.setElementsTo(this.getId(), await this.shapeFormInner())
    }
    public async unrender(): Promise<void> {
        await renderManager.clearContentOf(this.getId())
    }
    public abstract shapeForm(): RenderElement | Promise<RenderElement>
    public abstract shapeFormInner(): RenderElements | Promise<RenderElements>
}