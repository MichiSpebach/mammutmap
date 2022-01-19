import { mock } from 'jest-mock-extended'
import { FileBox } from '../../src/box/FileBox'
import { FileBoxBody } from '../../src/box/FileBoxBody'
import { renderManager } from '../../src/RenderManager'

test('executeRender image with windows (backslash) path', async () => {
  const scenario = setupScenarioForExecuteRender('image.png', 'C:\\\\backslashPath\\image.png')
  await scenario.boxBody.executeRender()
  expect(scenario.getRenderedContent()).toContain('src="C:&#92;&#92;backslashPath&#92;image.png"')
})

function setupScenarioForExecuteRender(referenceBoxName: string, referenceBoxSrcPath: string): {
  boxBody: FileBoxBody,
  getRenderedContent: () => string
} {
  const referenceBox: FileBox = mock<FileBox>()
  const boxBody: FileBoxBody = new FileBoxBody(referenceBox)

  referenceBox.getName = () => referenceBoxName
  referenceBox.getSrcPath = () => referenceBoxSrcPath
  let renderedContent: string
  renderManager.setContentTo = (_: string, content: string): Promise<void> => {
    renderedContent = content
    return Promise.resolve()
  }

  return {boxBody: boxBody, getRenderedContent: () => renderedContent}
}
