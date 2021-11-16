import puppeteer = require('puppeteer-core')
import { spawn } from 'child_process'
import { Browser, Page } from 'puppeteer-core'
import * as util from '../src/util'

const electronDebugPort: number = 9200
const timeoutForPuppeteerToConnectToElectronInMs: number = 15000
const timeoutForPageToFullyLoadInMs: number = 10000

let page: Page|undefined

export async function ensureInit(): Promise<void> {
  if (!page) {
    page = await init()
  }
}

export async function shutdown(): Promise<void> {
  if (!page) {
    throw new Error('shutdown called although not initialized')
  }
  await page.close()
  page = undefined
}

export async function getTitle(): Promise<string> {
  return (await getPage()).title()
}

async function getPage(): Promise<Page> {
  if (!page) {
    page = await init()
  }
  return page
}

async function init(): Promise<Page> {
  startApp()
  let page: Page = await connectToApp()
  await waitUntilFullyLoaded(page)
  return page
}

function startApp(): void {
  spawn('electron', ['.', `--remote-debugging-port=${electronDebugPort}`], {
    shell: true
  })
}

async function connectToApp(): Promise<Page> {
  const timecap = Date.now() + timeoutForPuppeteerToConnectToElectronInMs
  let browser: Browser|undefined
  while (!browser) {
    try {
      browser = await puppeteer.connect({browserURL: `http://localhost:${electronDebugPort}`})
    } catch (error) {
      if (Date.now() > timecap) {
        throw error
      }
      console.log(`wait ${timecap-Date.now()}ms until connection to app succeeds`)
      await util.wait(100)
    }
  }
  return (await browser.pages())[0]
}

async function waitUntilFullyLoaded(page: Page): Promise<void> {
  const timecap: number = Date.now() + timeoutForPageToFullyLoadInMs
  while(await page.title() === '') {
    if (Date.now() > timecap) {
      throw new Error(`not fully loaded until timeout of ${timeoutForPageToFullyLoadInMs}ms`)
    }
    console.log(`wait ${timecap-Date.now()}ms until fully loaded`)
    await util.wait(100)
  }
}
