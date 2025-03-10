import { Box, FileBox, getRootFolder, renderManager } from '../../dist/pluginFacade'
import { isSubPathOrEqual } from './pathUtil'
import { ChangedFile } from './GitClient'
import { openChanges } from "./gitWitchcraft";

let isInitialized: boolean = false
let currentFiles: ChangedFile[] = []
let lastFiles: ChangedFile[] = []
let forceRestyle: boolean = false

const ADDITION_COLOR = 'lime'
const DELETION_COLOR = 'red'
const BORDER_WIDTH = '5px'

function getFilesForBox(box: Box, files: ChangedFile[]): ChangedFile[] {
	return files.filter(file => isSubPathOrEqual(file.absolutePath, box.getSrcPath()))
}

function initializeBoxHighlighting(): void {
	if (isInitialized) {
		return
	}
	isInitialized = true
	const renderBackup = Box.prototype.render
	Box.prototype.render = async function () {
		const isRendered: boolean = this.isRendered() // store if rendered, because renderBackup.call sets it true
		await renderBackup.call(this)
		const lastFilesForBox: ChangedFile[] = getFilesForBox(this, lastFiles)
		if (lastFilesForBox.length > 0 && forceRestyle) {
			await removeCurrentHighlighting(this)
			await removeOpenChangesButton(this)
		}
		const changedFilesForBox: ChangedFile[] = getFilesForBox(this, currentFiles)
		if (changedFilesForBox.length > 0 && (!isRendered || forceRestyle)) {
			if (this.isFolder()) {
				await highlightFolderBox(this, changedFilesForBox)
			} else {
				await highlightBox(this, changedFilesForBox[0])
				await addOpenChangesButton(this as FileBox, changedFilesForBox[0])
			}
		}
	}
}

async function highlightFolderBox(box: Box, changedFilesInFolder: ChangedFile[]) {
	let numberOfAddedLines: number = 0
	let numberOfDeletedLines: number = 0
	for (const changedFile of changedFilesInFolder) {
		numberOfAddedLines += changedFile.numberOfAddedLines
		numberOfDeletedLines += changedFile.numberOfDeletedLines
	}
	await highlightBox(box, {
		absolutePath: box.getSrcPath(),
		numberOfAddedLines: numberOfAddedLines,
		numberOfDeletedLines: numberOfDeletedLines
	})
}

export async function highlightBoxes(changedFiles: ChangedFile[]): Promise<void> {
	currentFiles = changedFiles
	initializeBoxHighlighting()
	forceRestyle = true
	await getRootFolder().render()
	forceRestyle = false
	lastFiles = currentFiles
}

async function highlightBox(box: Box, changedFileOrFolder: ChangedFile): Promise<void> {
	const borderGradient: string = createBorderGradient(changedFileOrFolder)
	await renderManager.addStyleTo(box.getBorderId(), {
		borderWidth: BORDER_WIDTH,
		borderImageSlice: '1',
		borderImageSource: borderGradient
	})
	await renderManager.addElementTo(`${box.header.getId()}Inner`, {
		id: `${box.header.getId()}Inner-gitDiff`,
		type: 'div',
		children: [{
			type: 'span',
			innerHTML: `${changedFileOrFolder.numberOfAddedLines}+&nbsp;`,
			style: {color: ADDITION_COLOR}
		}, {
			type: 'span',
			innerHTML: `${changedFileOrFolder.numberOfDeletedLines}-&nbsp;`,
			style: {color: DELETION_COLOR}
		}],
		style: {float: 'right'}
	})
}

function createBorderGradient(changedFile: ChangedFile): string {
	const numberOfChanges: number = changedFile.numberOfAddedLines + changedFile.numberOfDeletedLines
	const percentageOfAdditions: number = changedFile.numberOfAddedLines / numberOfChanges * 100
	return `linear-gradient(45deg, ${ADDITION_COLOR}, ${percentageOfAdditions}%, ${DELETION_COLOR})`
}

async function removeCurrentHighlighting(box: Box): Promise<void> {
	await renderManager.addStyleTo(box.getBorderId(), {
		borderImageSlice: '0',
		borderImageSource: 'none',
		borderWidth: null
	})
	await renderManager.remove(`${box.header.getId()}Inner-gitDiff`)
}

async function addOpenChangesButton(box: FileBox, changedFile: ChangedFile): Promise<void> {
	const buttonId: string = `${box.getId()}-openChangesButton`
	await renderManager.addElementTo(`${box.header.getId()}Inner`, {
		type: 'button',
		children: 'Open Changes',
		id: buttonId,
		title: 'Uses git difftool: https://git-scm.com/docs/git-difftool\\n' +
			'Make sure you have it configured, e.g. for VSCode:\\n' +
			'[diff]\\n' +
			'    tool = default-difftool\\n' +
			'[difftool \\"default-difftool\\"]\\n' +
			'    cmd = code --wait --diff \\$LOCAL \\$REMOTE',
		style: {float: 'right', marginRight: '5px', marginTop: '2px', cursor: 'pointer'},
		onclick: () => openChanges(changedFile)
	})
	await renderManager.addEventListenerTo(buttonId, 'mousedown', () => {
	}) // workaround to catch events before dragManager starts dragging
	await renderManager.addEventListenerTo(buttonId, 'mouseup', () => {
	})
}

async function removeOpenChangesButton(box: Box): Promise<void> {
	if (box.isFolder()) {
		return
	}
	await renderManager.remove(`${box.getId()}-openChangesButton`)
}