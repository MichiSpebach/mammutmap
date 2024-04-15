import { log } from '../logService'
import { Box } from './Box'
import { BoxWatcher } from './BoxWatcher'
import { FolderBox } from './FolderBox'

export class BoxDepthTreeIterator {
	private readonly srcPathsToIgnore: string[]
	private boxIterators: ChildBoxesIterator[]|undefined
	protected nextBox: Box|null

	public constructor(rootBox: FolderBox, options?: {srcPathsToIgnore?: string[]}) {
		this.srcPathsToIgnore = options?.srcPathsToIgnore ?? []
		this.nextBox = rootBox
	}

	public async hasNextOrUnwatch(): Promise<boolean> {
		await this.prepareNext()
		return this.nextBox !== null
	}

	public async next(): Promise<Box|never> {
		await this.prepareNext()
		if (!this.nextBox) {
			log.errorAndThrow('FileBoxDepthTreeIterator::next() was called, but there are no FileBoxes left, call hasNext() to check if next exists.')
		}
		const nextBox = this.nextBox
		this.nextBox = null
		return nextBox;
	}

	protected async prepareNext(): Promise<void> {
		await this.prepareNextRecursive()
	}

	private async prepareNextRecursive(): Promise<void> { // extra method because prepareNext() is overriden by subclass and would lead to unnecessary calls
		if (!this.boxIterators) {
			if (!this.nextBox) {
				log.errorAndThrow('FileBoxDepthTreeIterator::prepareNext() was called, but boxIterators and nextBox are not set.')
			}
			this.boxIterators = [await ChildBoxesIterator.new(this.nextBox as FolderBox)]
		}
		if (this.nextBox || this.boxIterators.length === 0) {
			return
		}

		const currentBoxIterator: ChildBoxesIterator = this.boxIterators[this.boxIterators.length-1]
		if (!(await currentBoxIterator.hasNextOrUnwatch())) {
			this.boxIterators.pop()
			await this.prepareNextRecursive()
			return
		}

		const nextBox: Box = currentBoxIterator.next()
		if (this.srcPathsToIgnore.includes(nextBox.getSrcPath())) {
			this.nextBox = null
			await this.prepareNextRecursive()
			return
		}

		if (nextBox instanceof FolderBox) { // TODO: ensure also render of FileBoxes?
			this.boxIterators.push(await ChildBoxesIterator.new(nextBox))
		}
		this.nextBox = nextBox
	}

	public async breakAndUnwatch(): Promise<void> {
		if (!this.boxIterators) {
			log.warning('BoxDepthTreeIterator::breakAndUnwatch() not initialized or breakAndUnwatch() was already called.')
		} else {
			await Promise.all(this.boxIterators.map(async iterator => await iterator.breakAndUnwatch()))
			this.boxIterators = undefined
		}
	}
}

class ChildBoxesIterator {
	private readonly parent: BoxWatcher
	private readonly childs: Box[]
	private nextIndex: number

	public static async new(parent: FolderBox): Promise<ChildBoxesIterator> {
		return new ChildBoxesIterator(
			await BoxWatcher.newAndWatch(parent),
			this.sortBoxesByFilesFirst(parent.getBoxes())
		)
	}

	private constructor(parent: BoxWatcher, childs: Box[]) {
		this.parent = parent
		this.childs = childs
		this.nextIndex = 0
	}

	private static sortBoxesByFilesFirst(boxes: Box[]): Box[] {
		const fileBoxes: Box[] = []
		const folderBoxes: Box[] = []

		for (const box of boxes) {
			if (box.isFile()) {
				fileBoxes.push(box)
			} else {
				folderBoxes.push(box)
			}
		}

		return fileBoxes.concat(folderBoxes)
	}

	public async hasNextOrUnwatch(): Promise<boolean> {
		const hasNext: boolean = this.nextIndex < this.childs.length
		if (!hasNext) {
			await this.parent.unwatch()
		}
		return hasNext
	}

	public next(): Box {
		return this.childs[this.nextIndex++]
	}

	public async breakAndUnwatch(): Promise<void> {
		await this.parent.unwatch()
	}
}