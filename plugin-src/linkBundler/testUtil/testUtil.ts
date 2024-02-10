/**
 * copied from '../../../test/testUtil'
 * importing from 'test' would lead to imports from 'src' and not from 'dist' which would result in other modules
 * TODO: find better solution
 */
import { MockProxy, mock } from 'jest-mock-extended'
import { RenderManager, init as initRenderManager } from '../../../dist/core/RenderManager'
import { BoxManager, init as initBoxManager } from '../../../dist/core/box/BoxManager'
import * as settings from '../../../dist/core/settings/settings'
import * as fileSystem from '../../../dist/core/fileSystemAdapter'
import { FileSystemAdapter } from '../../../dist/core/fileSystemAdapter'
import { RelocationDragManager } from '../../../dist/core/RelocationDragManager'
import * as relocationDragManager from '../../../dist/core/RelocationDragManager'
import { override as overrideLink } from '../../../dist/core/link/Link'
import { HighlightPropagatingLink } from '../HighlightPropagatingLink'

const consoleLogBackup = console.log

export async function initServicesWithMocks(options?: {hideConsoleLog?: boolean}): Promise<{
	renderManager: MockProxy<RenderManager>
	boxManager: MockProxy<BoxManager>
	relocationDragManager: MockProxy<RelocationDragManager>
	fileSystem: MockProxy<FileSystemAdapter>
}> {
	const generalMocks = initGeneralServicesWithMocks()
	generalMocks.renderManager.getClientSize.mockReturnValue({width: 1600, height: 800})

	const relocationDragManagerMock: MockProxy<RelocationDragManager> = mock<RelocationDragManager>()
	relocationDragManager.init(relocationDragManagerMock)

	const fileSystemMock: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
	fileSystem.init(fileSystemMock)
	
	fileSystemMock.doesDirentExistAndIsFile.calledWith('./settings.json').mockReturnValue(Promise.resolve(true))
	fileSystemMock.readFile.calledWith('./settings.json').mockReturnValue(Promise.resolve('{"zoomSpeed": 3,"boxMinSizeToRender": 200,"sidebar": true}'))
	await settings.init()

	if (options?.hideConsoleLog) {
		jest.spyOn(console, 'log').mockImplementation()
	} else {
		console.log = consoleLogBackup
	}

	overrideLink(HighlightPropagatingLink)

	return {
		...generalMocks,
		relocationDragManager: relocationDragManagerMock,
		fileSystem: fileSystemMock
	}
}

export function initGeneralServicesWithMocks(): {
	renderManager: MockProxy<RenderManager>,
	boxManager: MockProxy<BoxManager>
} {
	const mocks = {
		renderManager: mock<RenderManager>(),
		boxManager: mock<BoxManager>()
	}

	initRenderManager(mocks.renderManager)
	initBoxManager(mocks.boxManager)

	return mocks
}
