import { RenderElement, RenderElements } from './RenderElement'

export abstract class SimpleWidget {
    public abstract form(): RenderElement
    public abstract formInner(): RenderElements
}