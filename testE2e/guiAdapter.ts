import puppeteer = require('puppeteer-core')
import { spawn } from 'child_process'
import { Browser, Page } from 'puppeteer-core'
import * as util from '../src/util'

const electronDebugPort: number = 9291
const timeoutForPuppeteerToConnectToElectronInMs: number = 15000

let page: Page|undefined

export async function startApp(): Promise<void> {
  spawn('electron', ['.', `--remote-debugging-port=${electronDebugPort}`], {
    shell: true
  })
  await connectToAppAndFindCorrectPage()
}

export async function shutdownApp(): Promise<void> {
  await (await getPage()).close()
  page = undefined
}

export async function getTitle(): Promise<string> {
  return (await getPage()).title()
}

export async function takeScreenshot(): Promise<Buffer|string> {
  return await (await getPage()).screenshot({type: 'png'})
}

export async function zoom(delta: number): Promise<void> {
  await (await getPage()).mouse.move(300, 300)
  await (await getPage()).mouse.wheel({deltaY: -delta})
}

export async function openFolder(path: string): Promise<void> {
  await command('open '+path)
  await waitUntilLogMatches((log: string) => log.endsWith('opening finished'), 2000)
}

export async function resetWindow(): Promise<void> {
  await (await getPage()).mouse.move(0, 0)
  await command('close')
  await waitUntilLogMatches((log: string) => log.endsWith('closing finished'), 2000)
  await command('clear')
  await waitUntilLogMatches((log: string) => log === '', 500)
}

async function command(command: string): Promise<void> {
  await type('commandLine', command+'\n')
}

async function type(id: string, text: string): Promise<void> {
  await (await getPage()).type('#'+id, text)
}

async function waitUntilLogMatches(condition:(log: string) => boolean, timelimitInMs: number): Promise<void> {
  const timecap: number = Date.now() + timelimitInMs
  while(!condition(await getLog())) {
    if (Date.now() > timecap) {
      throw new Error(`log does not match condition in time of ${timelimitInMs}ms`)
    }
    await util.wait(50)
  }
}

async function getLog(): Promise<string> {
  const logElement: puppeteer.ElementHandle<Element>|null = await findElementInPage(await getPage(), 'log')
  if (!logElement) {
    throw new Error('failed to get log')
  }
  return getContentOf(logElement)
}

async function findElementInPage(page: Page, elementId: string): Promise<puppeteer.ElementHandle<Element>|null> {
  return await page.$('#'+elementId)
}

async function getContentOf(element: puppeteer.ElementHandle<Element>): Promise<string> {
  return (await element.getProperty('innerText'))._remoteObject.value
}

async function getPage(): Promise<Page> {
  if (!page) {
    page = await connectToAppAndFindCorrectPage()
  }
  return page
}

async function connectToAppAndFindCorrectPage(): Promise<Page> {
  let browser: Browser = await connectToApp()
  return findCorrectPage(browser)
}

async function connectToApp(): Promise<Browser> {
  const timecap = Date.now() + timeoutForPuppeteerToConnectToElectronInMs
  let browser: Browser|undefined
  while (!browser) {
    try {
      browser = await puppeteer.connect({
        browserURL: `http://localhost:${electronDebugPort}`
      })
    } catch (error) {
      if (Date.now() > timecap) {
        throw error
      }
      console.log(`wait ${timecap-Date.now()}ms until connection to app succeeds`)
      await util.wait(100)
    }
  }
  return browser
}

async function findCorrectPage(browser: Browser): Promise<Page> {
  const pages: Page[] = await browser.pages()
  for (page of pages) {
    if (await isCorrectPage(page)) {
      return page
    }
  }
  throw new Error('browser does not contain correct page, might happen when electronDebugPort is not free')
}

async function isCorrectPage(page: Page): Promise<boolean> {
  return await page.title() !== ''
}
