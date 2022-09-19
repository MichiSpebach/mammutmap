
// TODO rename to RenderingWidget and introduce (Simple)Widget with formHtml() method that does not need to know renderManager
// TODO all gui components should inherit this (Box, BoxHeader, BoxBody, Link, LinkEnd, ...)
export abstract class Widget {
    public abstract getId(): string
    public abstract render(): Promise<void> // TODO for some gui components render needs arguments
}