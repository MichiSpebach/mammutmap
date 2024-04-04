import { TextInputPopup } from '../pluginFacade'
import { ChildProcess, EnvironmentAdapter } from '../core/environmentAdapter'
import { log } from '../core/logService'
import { util } from '../core/util/util'
import { MessagePopup } from '../core/MessagePopup'

export class BrowserEnvironmentAdapter implements EnvironmentAdapter {

	public getEnvironmentName(): 'browser' {
		return 'browser'
	}

	public runShellCommand(command: string, options: unknown): ChildProcess {
		throw new Error('Method not implemented.');
	}

	public async openFile(path: string): Promise<void> {
		const desktopVersionLinkHtml: string = util.createWebLinkHtml(util.githubProjectAddress, 'desktop version')
		const vscodeExtensionLinkHtml: string = util.createWebLinkHtml(util.vscodeMarketplaceAddress, 'VS Code extension')
		const message = `Not supported in browserEnvironment, install ${desktopVersionLinkHtml} or ${vscodeExtensionLinkHtml}.`
		log.errorWithoutThrow(`BrowserEnvironmentAdapter::openFile(path: '${path}'): ${message}`, {allowHtml: true})
		MessagePopup.buildAndRender('Opening Files', message)
		return
		const absoluteProjectParentFolder: string|undefined = await TextInputPopup.buildAndRenderAndAwaitResolve(`Open '${path}'`, 'c:/path/to/projectParentFolder')
		if (!absoluteProjectParentFolder) {
			log.warning(`BrowserEnvironmentAdapter::openFile(path: '${path}') no absoluteProjectParentFolder provided.`)
		}
		try {
			const fileWindow: Window|null = window.open(`file://${absoluteProjectParentFolder}${path}`)
			if (!fileWindow) {
				log.warning(`BrowserEnvironmentAdapter::openFile(path: '${path}'): window.open(..) returned ${fileWindow}, most likely due to "Not allowed to load local resource".`)
			}
		} catch (error: unknown) { // error is not thrown, only appears in the browser console: "Not allowed to load local resource"
			log.warning(`BrowserEnvironmentAdapter::openFile(path: '${path}'): ${error}`)
		}
	}

}