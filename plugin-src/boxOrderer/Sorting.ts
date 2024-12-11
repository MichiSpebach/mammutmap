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
		this.items.sort((a: Item, b: Item) => a.position - b.position)
		for (let i = 0; i < this.items.length; i++) {
			this.pushDown(i, 0)
			this.pushUp(i, 0)
		}
	}

	private pushDown(index: number, amount: number): void {
		const item: Item = this.items[index]
		if (index === 0) {
			item.position = Math.max(item.position - amount/2, 0)
			return
		}
		const nextItem: Item = this.items[index-1]
		const distance: number = item.position - (nextItem.position+nextItem.size)
		if (distance >= amount) {
			item.position -= amount/2
			return
		}
		this.pushDown(index-1, amount-distance)
		item.position = nextItem.position+nextItem.size
	}

	private pushUp(index: number, amount: number): void {
		const item: Item = this.items[index]
		if (index === this.items.length-1) {
			item.position = Math.min(item.position + amount/2, 100-item.size)
			return
		}
		const nextItem: Item = this.items[index+1]
		const distance: number = nextItem.position - (item.position+item.size)
		if (distance >= amount) {
			item.position += amount/2
			return
		}
		this.pushUp(index+1, amount-distance)
		item.position = nextItem.position-item.size
	}
}