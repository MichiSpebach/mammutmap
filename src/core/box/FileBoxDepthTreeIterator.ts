import { log } from '../logService'
import { Box } from './Box'
import { BoxDepthTreeIterator } from './BoxDepthTreeIterator'
import { FileBox } from './FileBox'

export class FileBoxDepthTreeIterator extends BoxDepthTreeIterator {

	public override async next(): Promise<FileBox|never> {
		const nextBox: Box = await super.next()
		if (!(nextBox instanceof FileBox)) {
			log.warning('FileBoxDepthTreeIterator::next() is not a FileBox, this should have been prevented by FileBoxDepthTreeIterator::prepareNext().')
		}
		return nextBox as FileBox
	}

	protected override async prepareNext(): Promise<void> {
		await super.prepareNext()
		if (this.nextBox && !(this.nextBox instanceof FileBox)) {
			this.nextBox = null
			await this.prepareNext()
		}
	}

}