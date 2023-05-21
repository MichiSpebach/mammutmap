import { spawn } from 'child_process'
import * as puppeteer from 'puppeteer-core'
import { util } from '../src/core/util/util'

const electronDebugPort: number = 9291
const timeoutForPuppeteerToConnectToElectronInMs: number = 15000
const viewportWidth: number = 1600
const viewportHight: number = 800
const defaultScreenshotClip = {x:0, y: 0, width: 800, height: 800}

let page: puppeteer.Page|undefined
let boxIteratorLastFilePath: string|null = null
let latestMousePosition: {x: number, y: number}|undefined = undefined

export async function startApp(): Promise<void> {
  spawn('electron', ['.', `--remote-debugging-port=${electronDebugPort} --skip-plugins=true`], {
    shell: true
  })
  await connectToAppAndFindCorrectPage()
  await command('setCompatibilityTheme')
  await command('setLogDebugActivated true')
  await command('setHtmlCursorActivated true')
  await runInMainThread(`async () => {
    const {relocationDragManager} = await importRelativeToSrc('./core/RelocationDragManager')
    const {mouseDownDragManager} = await importRelativeToSrc('./core/mouseDownDragManager')
    const {settings} = await importRelativeToSrc('./core/Settings')

    relocationDragManager.dragManager = mouseDownDragManager // TODO: remove as soon as mouseDownDragManager is standard
    settings.setBoolean('boxesDraggableIntoOtherBoxes', true)
  }`)
}

export async function shutdownApp(): Promise<void> {
  await runInMainThread(`async () => {
    const {settings} = await importRelativeToSrc('./core/Settings')
    settings.setBoolean('boxesDraggableIntoOtherBoxes', false)
  }`)
  await (await getPage()).close()
  page = undefined
}

export async function getTitle(): Promise<string> {
  return (await getPage()).title()
}

export async function logInfo(message: string): Promise<void> {
  await runInMainThread(`async () => {
    const {util} = await importRelativeToSrc('./core/util/util')
    util.logInfo('${message}')
  }`)
}

export async function runInMainThread(code: string/* | () => Promise<void> TODO*/): Promise<void> {
  await runInRenderThread(`runInMainThread(${code})`)
}

export async function runInRenderThread(code: string/* | () => Promise<void> TODO*/): Promise<void> {
  await (await getPage()).evaluate(code)
}

export async function fireMouseOver(x: number, y: number): Promise<void> {
  await runInRenderThread(`
    document.elementFromPoint(${x}, ${y}).dispatchEvent(new Event('mouseover', {bubbles: true}))
  `)
}

export async function moveMouseTo(x: number, y: number, options?: {steps?: number}): Promise<void> {
  latestMousePosition = {x, y}
  await (await getPage()).mouse.move(x, y, options)
}

export async function dragTo(x: number, y: number): Promise<void> {
  await mouseDown()
  await fireMouseOver(x, y) // somehow puppeteer does not fire mouseover events while mousedown, TODO: check if playwright works better and switch to playwright if so
  await moveMouseTo(x, y)
  await fireMouseOver(x, y) // somehow puppeteer does not fire mouseover events while mousedown, TODO: check if playwright works better and switch to playwright if so
  await util.wait(10) // TODO: otherwise operation may not have finished, improve
  await mouseUp()
  // await waitUntilLastLogIncludes(`dragging to {x: ${x}, y: ${y}} finished`) TODO: await until finished
}

export async function click(x: number, y: number): Promise<void> {
  latestMousePosition = {x, y}
  await (await getPage()).mouse.click(x, y)
}

export async function mouseDown(): Promise<void> {
  await (await getPage()).mouse.down()
}

export async function mouseUp(): Promise<void> {
  await (await getPage()).mouse.up()
}

export async function takeScreenshot(
  clip: {x: number, y: number, width: number, height: number} = defaultScreenshotClip
): Promise<Buffer|string> {
  return await (await getPage()).screenshot({type: 'png', clip})
}

export async function zoom(delta: number): Promise<void> {
  await zoomWithoutWaitingUntilFinished(delta)
  await waitUntilLastLogIncludes(`zooming ${delta} finished`, 2000)
}

export async function zoomWithoutWaitingInBetween(deltas: number[]): Promise<void> {
  for (const delta of deltas) {
    await zoomWithoutWaitingUntilFinished(delta)
  }
  await waitUntilLogsMatch((logs: string[]): boolean => {
    for (const delta of deltas) {
      if (!logs.some(log => log.includes(`zooming ${delta} finished`))) {
        return false
      }
    }
    return true
  }, 2000)
}

async function zoomWithoutWaitingUntilFinished(delta: number): Promise<void> {
  await (await getPage()).focus('#map') // otherwise sometimes wheel does not work immediately
  delta *= 0.8 // TODO: somehow the value the app receives is larger, fix this
  await (await getPage()).mouse.wheel({deltaY: -delta})
}

export async function openFolder(path: string): Promise<void> {
  await command('open '+path)
  await waitUntilLastLogEndsWith('opening finished', 2000)
}

export async function resetWindow(): Promise<void> {
  await moveMouseTo(0, 0)
  await closeFolder()
  await clearTerminal()
}

export async function closeFolder(): Promise<void> {
  await command('close')
  await waitUntilLastLogEndsWith('closing finished', 2000)
}

export async function clearTerminal(): Promise<void> {
  await command('clear')
  await waitUntilLogsEqual([], 500)
}

export async function startBoxIterator(): Promise<void> {
  boxIteratorLastFilePath = null
  await command('pluginFacade start')
  await waitUntilLastLogEndsWith('boxIterator ready', 500)
}

export async function getNextSourcePathOfBoxIterator(): Promise<string|undefined> {
  await command('pluginFacade printNextBox')
  const nextBoxMarker: string = 'Info: next box is '
  const noFurtherBoxesMarker: string = 'Info: no further boxes to iterate'
  const getFilePathIn = (log: string) => log.substring(nextBoxMarker.length)

  const lastLog: string = await waitUntilLastLogMatches(
    (log: string) => (log.startsWith(nextBoxMarker) && getFilePathIn(log) !== boxIteratorLastFilePath) || log === noFurtherBoxesMarker,
    500,
    (lastLog: string) => `failed to get source path of box in last log, last log is "${lastLog}"`
  )

  if (lastLog.startsWith(nextBoxMarker)) {
    boxIteratorLastFilePath = getFilePathIn(lastLog)
    return boxIteratorLastFilePath
  } else {
    boxIteratorLastFilePath = null
    return undefined
  }
}

export async function clearWatchedBoxes(): Promise<void> {
  await command('pluginFacade clearWatchedBoxes')
  await waitUntilLastLogEndsWith('watchedBoxes cleared', 500)
}

export async function watchBox(sourcePath: string): Promise<void> {
  await command('pluginFacade watchBox '+sourcePath)
  await waitUntilLastLogEndsWith('watching '+sourcePath, 500)
}

export async function unwatchBox(sourcePath: string): Promise<void> {
  await command('pluginFacade unwatchBox '+sourcePath)
  await waitUntilLastLogEndsWith('unwatched '+sourcePath, 500)
}

async function command(command: string): Promise<void> {
  await type('commandLine', command+'\n')
  await removeFocus()
}

async function type(id: string, text: string): Promise<void> {
  await (await getPage()).type('#'+id, text)
}

async function removeFocus(): Promise<void> {
  await (await getPage()).mouse.click(0, 0)
  if (latestMousePosition) {
    await moveMouseTo(latestMousePosition.x, latestMousePosition.y)
  }
}

export async function waitUntilLogsEqual(expectedLogs: string[], timelimitInMs: number): Promise<void> {
  try {
    await waitUntilLogsMatch((logs: string[]) => {
      if (logs.length !== expectedLogs.length) {
        return false
      }
      for (let i = 0; i < logs.length; i++) {
        if (logs[i] !== expectedLogs[i]) {
          return false
        }
      }
      return true
    }, timelimitInMs)
  } catch (error) {
    console.trace(error)
  }
  expect(await getLogs()).toEqual(expectedLogs) // for nice message
}

async function waitUntilLastLogEndsWith(ending: string, timelimitInMs: number): Promise<string> {
  return waitUntilLastLogMatches(
    (log: string) => log.endsWith(ending),
    timelimitInMs,
    (lastLog: string) => `last log does not end with "${ending}" in time of ${timelimitInMs}ms, last log is "${lastLog}"`
  )
}

async function waitUntilLastLogIncludes(substring: string, timelimitInMs: number): Promise<string> {
  return waitUntilLastLogMatches(
    (log: string) => log.includes(substring),
    timelimitInMs,
    (lastLog: string) => `last log does not include "${substring}" in time of ${timelimitInMs}ms, last log is "${lastLog}"`
  )
}

async function waitUntilLastLogMatches(
  condition: (log: string) => boolean,
  timelimitInMs: number,
  generateErrorMessage: (lastLog: string) => string
): Promise<string> {
  const timecap: number = Date.now() + timelimitInMs
  let nextSleepInMs: number = 1
  while(true) {
    const lastLog: string = await getLastLog()
    if (condition(lastLog)) {
      return lastLog
    }
    if (Date.now() > timecap) {
      throw new Error(generateErrorMessage(lastLog))
    }
    await util.wait(nextSleepInMs)
    nextSleepInMs *= 2
  }
}

async function waitUntilLogsMatch(condition:(logs: string[]) => boolean, timelimitInMs: number): Promise<void> {
  const timecap: number = Date.now() + timelimitInMs
  let nextSleepInMs: number = 1
  while(true) {
    const logs: string[] = await getLogs()
    if (condition(logs)) {
      return
    }
    if (Date.now() > timecap) {
      let message = `Logs do not match condition in time of ${timelimitInMs}ms.`
      message += `\nCondition is: "${condition}".`
      message += `\nLogs are: "${logs}".`
      throw new Error(message)
    }
    await util.wait(nextSleepInMs)
    nextSleepInMs *= 2
  }
}

async function getLastLog(): Promise<string> {
  const logs: puppeteer.ElementHandle<HTMLDivElement>[] = await (await getLogElement()).$$('div')
  if (logs.length === 0) {
    return ''
  }
  return getContentOf(logs[logs.length-1])
}

export async function getLogs(): Promise<string[]> {
  const logElements: puppeteer.ElementHandle<HTMLDivElement>[] = await (await getLogElement()).$$('div')
  if (logElements.length === 0) {
    return []
  }

  const logPromises: Promise<string>[] = logElements.map(log => getContentOf(log))
  return Promise.all(logPromises)
}

async function getLogElement(): Promise<puppeteer.ElementHandle<Element>> {
  const logElement: puppeteer.ElementHandle<Element>|null = await findElement('log')
  if (!logElement) {
    throw new Error('Failed to get log.')
  }
  return logElement
}

async function findElement(id: string): Promise<puppeteer.ElementHandle<Element>|null> {
  return await (await getPage()).$('#'+id)
}

async function getContentOf(element: puppeteer.ElementHandle<Element>): Promise<string> {
  const remoteObject: puppeteer.Protocol.Runtime.RemoteObject = (await element.getProperty('innerText')).remoteObject()
  if (remoteObject.value === undefined || remoteObject.value === null) {
    throw new Error('Failed to getContentOf(element) because remoteObject does not have a value.')
  }
  return remoteObject.value
}

async function getPage(): Promise<puppeteer.Page> {
  if (!page) {
    page = await connectToAppAndFindCorrectPage()
  }
  return page
}

async function connectToAppAndFindCorrectPage(): Promise<puppeteer.Page> {
  let browser: puppeteer.Browser = await connectToAppWithRetries()
  return findCorrectPage(browser)
}

async function connectToAppWithRetries(): Promise<puppeteer.Browser> {
  const startTime: number = Date.now()
  const timecap: number = startTime+timeoutForPuppeteerToConnectToElectronInMs
  let browser: puppeteer.Browser|undefined
  const errors: unknown[] = []

  for (let tryIndex: number = 0; !browser; tryIndex++) {
    const tryBrowserUrl: string = tryIndex%2 === 0
      ? `http://127.0.0.1:${electronDebugPort}`
      : `http://localhost:${electronDebugPort}` // does not work in some environments because of IPv6 issues
    
    try {
      browser = await connectToAppOrFail(tryBrowserUrl)
      if (tryIndex > 0) { // otherwise log is called for each test suite, TODO: improve test setup that connection/pageObject is cached
        console.log(`Connecting to app succeeded with browserURL ${tryBrowserUrl}.`)
      }
    } catch (error: unknown) {
      errors.push(error)
      if (Date.now() > timecap) {
        console.log(`None of the ${tryIndex+1} tries within ${Date.now()-startTime}ms to connect to app worked, see errors for details.`)
        throw errors
      }
      console.log(`Waiting ${timecap-Date.now()}ms until connection to app succeeds...`)
      await util.wait(100) // TODO: increase wait time logarithmically?
    }
  }

  return browser
}

async function connectToAppOrFail(browserURL: string): Promise<puppeteer.Browser> | never {
  return puppeteer.connect({
    browserURL: browserURL,
    defaultViewport: {
      width: viewportWidth,
      height: viewportHight
    }
  })
}

async function findCorrectPage(browser: puppeteer.Browser): Promise<puppeteer.Page> {
  const pages: puppeteer.Page[] = await browser.pages()
  for (page of pages) {
    if (await isCorrectPage(page)) {
      return page
    }
  }
  throw new Error('browser does not contain correct page, might happen when electronDebugPort is not free')
}

async function isCorrectPage(page: puppeteer.Page): Promise<boolean> {
  return await page.title() !== ''
}
