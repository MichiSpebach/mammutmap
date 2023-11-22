import { log } from '../logService'
import { Box } from './Box'
import { BoxWatcher } from './BoxWatcher'
import { FolderBox } from './FolderBox'

export class BoxDepthTreeIterator {
	private readonly boxIterators: BoxIterator[]
	private boxWatchers: BoxWatcher[] = [] // TODO: limit active boxWatchers at a time to e.g. 100!
	protected nextBox: Box|null

	public constructor(rootBox: FolderBox) {
		this.boxIterators = []
		this.boxIterators.push(new BoxIterator([rootBox]))
		this.nextBox = null
	}

	public async hasNext(): Promise<boolean> {
		await this.prepareNext()
		if (!this.nextBox) {
			this.clearWatchedBoxes() // TODO: implement better solution
		}
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
		if (this.nextBox || this.boxIterators.length === 0) {
			return
		}

		const currentBoxIterator = this.getCurrentBoxIterator()
		if (currentBoxIterator.hasNext()) {
			const nextBox: Box = currentBoxIterator.next()
			await this.addWatcherFor(nextBox)
			 if (nextBox.isFolder()) {
				this.boxIterators.push(new BoxIterator((nextBox as FolderBox).getBoxes()))
			}
			this.nextBox = nextBox
		} else {
			this.boxIterators.pop()
			await this.prepareNext()
		}
	}

	private getCurrentBoxIterator(): BoxIterator {
		return this.boxIterators[this.boxIterators.length-1]
	}

	private async addWatcherFor(box: Box): Promise<void> {
		const boxWatcher: BoxWatcher = await BoxWatcher.newAndWatch(box)
		this.boxWatchers.push(boxWatcher)
	}

	public async clearWatchedBoxes(): Promise<void> {
		while (this.boxWatchers.length > 0) {
			const boxWatcher: BoxWatcher|undefined = this.boxWatchers.shift()
			if (boxWatcher) {
				await boxWatcher.unwatch()
			}
		}
	}
}

class BoxIterator {
	private readonly boxes: Box[]
	private nextIndex: number

	public constructor(boxes: Box[]) {
		this.boxes = this.sortBoxesByFilesFirst(boxes)
		this.nextIndex = 0
	}

	private sortBoxesByFilesFirst(boxes: Box[]): Box[] {
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

	public hasNext(): boolean {
		return this.nextIndex < this.boxes.length
	}

	public next(): Box {
		return this.boxes[this.nextIndex++]
	}
}