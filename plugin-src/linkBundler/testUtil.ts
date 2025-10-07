import { MockProxy } from 'jest-mock-extended'
import { RenderManager } from '../../src/core/renderEngine/renderManager'
import { BoxManager } from '../../src/core/box/BoxManager'
import { FileSystemAdapter } from '../../src/core/fileSystemAdapter'
import { RelocationDragManager } from '../../src/core/RelocationDragManager'
import { override as overrideLink } from '../../src/core/link/Link'
import { HighlightPropagatingLink } from './HighlightPropagatingLink'
import * as testUtil from '../../test/testUtil'

export async function initServicesWithMocksAndOverrideLink(options?: {hideConsoleLog?: boolean}): Promise<{
	renderManager: MockProxy<RenderManager>
	boxManager: MockProxy<BoxManager>
	relocationDragManager: MockProxy<RelocationDragManager>
	fileSystem: MockProxy<FileSystemAdapter>
}> {
	const services = await testUtil.initServicesWithMocks(options)
	
	overrideLink(HighlightPropagatingLink)

	return services
}