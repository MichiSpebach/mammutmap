import { Box } from '../../dist/core/box/Box'
import { NodeWidget } from '../../dist/core/node/NodeWidget'

export type Item = {
	node: Box|NodeWidget
	position: number
	size: number
}

export class Sorting {
	public readonly items: Item[]

	public constructor(items: Item[] = []) {
		this.items = items
	}

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
			item.position = Math.max(item.position - amount/2, 0)
			return
		}
		const nextItem: Item = this.items[index-1]
		const distance: number = item.position - (nextItem.position+nextItem.size)
		
		item.position -= amount/2
		this.pushDown(index-1, Math.max(amount-distance, 0))
		if (nextItem.position+nextItem.size > item.position) {
			item.position = nextItem.position+nextItem.size
		}
	}

	private pushUp(index: number, amount: number): void {
		const item: Item = this.items[index]
		if (index === this.items.length-1) {
			item.position = Math.min(item.position + amount/2, 100-item.size)
			return
		}
		const nextItem: Item = this.items[index+1]
		const distance: number = nextItem.position - (item.position+item.size)
		
		item.position += amount/2
		this.pushUp(index+1, Math.max(amount-distance, 0))
		if (nextItem.position < item.position+item.size) {
			item.position = nextItem.position-item.size
		}
	}
}