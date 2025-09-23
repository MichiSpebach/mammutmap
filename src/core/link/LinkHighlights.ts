import { log } from '../logService'

export type LinkHighlight = {handle: string, highlight?: true, bold?: true, foreground?: true}

export interface LinkHighlightsReadonly {
	hasHighlights(): boolean
	isHighlighted(): boolean
	isBold(): boolean
	isForegrounded(): boolean
}

export class LinkHighlights implements LinkHighlightsReadonly {
	private highlights: LinkHighlight[] = []

	public add(highlight: LinkHighlight, options?: {skipIfAlreadyAdded?: boolean}): void {
		if (this.highlights.some(otherHighlight => otherHighlight.handle === highlight.handle)) {
			if (!options?.skipIfAlreadyAdded) {
				log.warning(`LinkHighlights::add highlight with id '${highlight.handle}' already added`)
			}
			return
		}
		this.highlights.push(highlight)
	}

	public remove(id: string, options?: {skipIfNotAdded?: boolean}): void {
		const highlightIndex: number = this.highlights.findIndex(highlight => highlight.handle === id)
		if (highlightIndex < 0) {
			if (!options?.skipIfNotAdded) {
				log.warning(`LinkHighlights::remove highlight with id '${id}' not found`)
			}
			return
		}
		this.highlights.splice(highlightIndex, 1)
	}

	public hasHighlights(): boolean {
		return this.highlights.length > 0
	}

	public isHighlighted(): boolean {
		return this.highlights.some(highlight => highlight.highlight)
	}

	public isBold(): boolean {
		return this.highlights.some(highlight => highlight.bold)
	}

	public isForegrounded(): boolean {
		return this.highlights.some(highlight => highlight.foreground)
	}
}