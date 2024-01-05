import { MockProxy, mock } from 'jest-mock-extended'
import { RenderManager, init as initRenderManager } from '../../../dist/core/RenderManager'
import { BoxManager, init as initBoxManager } from '../../../dist/core/box/BoxManager'

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
