import { util } from '../src/util'
import { DocumentObjectModelAdapter } from '../src/domAdapter'

test('executeJavaScript', async () => {
  const scenario = setupScenario()

  expect(await scenario.dom.executeJavaScript('"successfully "+"executed"')).toBe('successfully executed')
})

test('executeJavaScript with error', async () => {
  const scenario = setupScenario()

  expect(async () => await scenario.dom.executeJavaScript('throw new Error("test error")')).rejects
    .toThrow(Error('error in render thread occured: test error. the javascript that was tried to execute was: throw new Error("test error")'))
})

test('executeJavaScript long javascript with error', async () => {
  const scenario = setupScenario()

  let rendererCode = 'const text = "'+'rendererCode throws Error but is too long to be fully displayed;'.repeat(4)+'"\n'
  rendererCode += 'throw new Error("error of long rendererCode")'
  expect(async () => await scenario.dom.executeJavaScript(rendererCode)).rejects
    .toThrow(Error('error in render thread occured: error of long rendererCode. the javascript that was tried to execute was: const text = "rendererCode throws Error but is too long to be fully displayed;rendererCode throws Error but is too long to be fu[.61.] fully displayed;rendererCode throws Error but is too long to be fully displayed;"\nthrow new Error("error of long rendererCode")'))
})

test('executeJavaScriptSuppressingErrors with error', async () => {
  const utilMock = mockUtil()
  const scenario = setupScenario()

  await scenario.dom.executeJavaScriptSuppressingErrors('throw new Error("test error")')

  expect(utilMock.warningCalls).toHaveLength(1)
  expect(utilMock.warningCalls).toContain('error in render thread occured: test error. the javascript that was tried to execute was: throw new Error("test error")')
})

function mockUtil(): {warningCalls: string[]} {
  const warningCalls: string[] = []
  util.logWarning = (message: string): void => {
    warningCalls.push(message)
  }
  return {warningCalls: warningCalls}
}

function setupScenario(): {dom: DocumentObjectModelAdapter} {
  const webContentsMock: any = Object
  webContentsMock.executeJavaScript = (rendererCode: string): Promise<any> => {
    return eval(rendererCode)
  }

  const windowMock: any = Object
  windowMock.webContents = webContentsMock

  return {dom: new DocumentObjectModelAdapter(windowMock)}
}
