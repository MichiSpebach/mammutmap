import { Widget } from './Widget'
import { BorderingLinks } from './link/BorderingLinks'

export abstract class AbstractNodeWidget /*TODO extends Widget*/ { // TODO: rename to NodeWidget
	public abstract readonly borderingLinks: BorderingLinks

	public abstract getId(): string

	public isRoot(): boolean {
		return false // TODO: replace with !this.parent?
	}

	public abstract getParent(): AbstractNodeWidget // TODO: will always return a Box, change to Box, but further cycle?

}