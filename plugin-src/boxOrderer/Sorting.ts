import { Box } from '../../src/core/box/Box'
import { NodeWidget } from '../../src/core/node/NodeWidget'

export type Item = {
	node: Box|NodeWidget
	position: number
	size: number
}

export class Sorting {

	public constructor(
		public readonly minimum: number = 0,
		public readonly maximum: number = 100,
		public readonly items: Item[] = [],
		public readonly marginBetweenItems: number = 0
	) {}

	public addItem(item: Item) {
		this.items.push(item)
	}

	public sort(): void {
		if (this.items.length < 1) {
			return
		}

		this.items.sort((a: Item, b: Item) => a.position - b.position)
		
		this.pushUp(0, 0)
		this.pushDown(this.items.length-1, 0)
	}

	private pushDown(index: number, amount: number): void {
		const item: Item = this.items[index]
		if (index === 0) {
			item.position = Math.max(item.position - amount/2, this.minimum)
			return
		}
		const nextItem: Item = this.items[index-1]
		const distance: number = item.position - (nextItem.position+nextItem.size)
		
		item.position -= amount/2
		this.pushDown(index-1, Math.max(amount-distance+this.marginBetweenItems, 0))
		if (nextItem.position+nextItem.size+this.marginBetweenItems > item.position) {
			item.position = nextItem.position+nextItem.size+this.marginBetweenItems
		}
	}

	private pushUp(index: number, amount: number): void {
		const item: Item = this.items[index]
		if (index === this.items.length-1) {
			item.position = Math.min(item.position + amount/2, this.maximum-item.size)
			return
		}
		const nextItem: Item = this.items[index+1]
		const distance: number = nextItem.position - (item.position+item.size)
		
		item.position += amount/2
		this.pushUp(index+1, Math.max(amount-distance+this.marginBetweenItems, 0))
		if (nextItem.position < item.position+item.size+this.marginBetweenItems) {
			item.position = nextItem.position-item.size-this.marginBetweenItems
		}
	}
}