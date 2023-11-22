import { BoxDepthTreeIterator } from './BoxDepthTreeIterator'
import { FileBox } from './FileBox'

export class FileBoxDepthTreeIterator extends BoxDepthTreeIterator {

	public override async next(): Promise<FileBox|never> {
		return super.next() as Promise<FileBox>
	}

	protected override async prepareNext(): Promise<void> {
		await super.prepareNext()
		if (this.nextBox && !(this.nextBox instanceof FileBox)) {
			this.nextBox = null
			await this.prepareNext()
		}
	}

}