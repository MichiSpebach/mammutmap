import { MockProxy, mock } from 'jest-mock-extended'
import { RenderManager, init as initRenderManager } from '../src/core/renderEngine/renderManager'
import { BoxManager, init as initBoxManager } from '../src/core/box/BoxManager'

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
