import { RenderElement, RenderElements } from '../renderEngine/RenderElement'

export abstract class SimpleWidget {
    public abstract form(): RenderElement
    public abstract formInner(): RenderElements
}