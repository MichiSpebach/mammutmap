import { log } from '../logService'
import { Box } from './Box'
import { BoxWatcher } from './BoxWatcher'
import { FileBox } from './FileBox'
import { FolderBox } from './FolderBox'

export class FileBoxDepthTreeIterator {
	private readonly boxIterators: BoxIterator[]
	private boxWatchers: BoxWatcher[] = []
	private nextBox: FileBox|null

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

	public async next(): Promise<FileBox|never> {
		await this.prepareNext()
		if (!this.nextBox) {
			log.errorAndThrow('FileBoxDepthTreeIterator::next() was called, but there are no FileBoxes left, call hasNext() to check if next exists.')
		}
		const nextBox = this.nextBox
		this.nextBox = null
		return nextBox;
	}

	private async prepareNext(): Promise<void> {
		if (this.nextBox || this.boxIterators.length === 0) {
			return
		}

		const currentBoxIterator = this.getCurrentBoxIterator()
		if (currentBoxIterator.hasNext()) {
			const nextBox: Box = currentBoxIterator.next()
			await this.addWatcherFor(nextBox)
			if (nextBox.isFile()) {
				this.nextBox = nextBox as FileBox
			} else if (nextBox.isFolder()) {
				this.boxIterators.push(new BoxIterator((nextBox as FolderBox).getBoxes()))
				await this.prepareNext()
			} else if (nextBox.isSourceless()) {
				await this.prepareNext()
			} else {
				log.warning(`FileBoxDepthTreeIterator::prepareNext() nextBox (id ${nextBox.getId()}) is neither FileBox nor FolderBox nor SourcelessBox`)
				await this.prepareNext()
			}
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