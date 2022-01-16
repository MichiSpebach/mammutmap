import { util } from '../src/util'
import { DocumentObjectModelAdapter } from '../src/domAdapter'

test('executeJavaScriptCrashSafe', async () => {
  const utilMock = mockUtil()
  const scenario = setupScenario()

  // TODO: 
  //await scenario.dom.executeJavaScriptCrashSafe('util.logInfo("successfully executed")')

  //expect(utilMock.infoCalls).toHaveLength(1)
  //expect(utilMock.infoCalls).toContain('successfully executed')
  expect(utilMock.warningCalls).toHaveLength(0)
})

test('executeJavaScriptCrashSafe with error', async () => {
  const utilMock = mockUtil()
  const scenario = setupScenario()

  await scenario.dom.executeJavaScriptCrashSafe('throw new Error("test error")')

  expect(utilMock.infoCalls).toHaveLength(0)
  expect(utilMock.warningCalls).toHaveLength(1)
  expect(utilMock.warningCalls).toContain('error in render thread occured: test error. the javascript that was tried to execute was: throw new Error("test error")')
})

test('executeJavaScriptCrashSafe long javascript with error', async () => {
  const utilMock = mockUtil()
  const scenario = setupScenario()

  let rendererCode = 'const text = "rendererCode throws Error but is too long to be fully displayed"\n'
  rendererCode += 'throw new Error("error of long rendererCode")'
  await scenario.dom.executeJavaScriptCrashSafe(rendererCode)

  expect(utilMock.infoCalls).toHaveLength(0)
  expect(utilMock.warningCalls).toHaveLength(1)
  expect(utilMock.warningCalls).toContain('error in render thread occured: error of long rendererCode. the javascript that was tried to execute was: const text = "rendererCode throws Error but is too[...]yed"\nthrow new Error("error of long rendererCode")')
})

function mockUtil(): {infoCalls: string[], warningCalls: string[]} {
  const infoCalls: string[] = []
  util.logInfo = (message: string): void => {
    infoCalls.push(message)
  }

  const warningCalls: string[] = []
  util.logWarning = (message: string): void => {
    warningCalls.push(message)
  }

  return {infoCalls: infoCalls, warningCalls: warningCalls}
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
