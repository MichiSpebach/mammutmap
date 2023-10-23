import { TextInputPopup } from '../pluginFacade';
import { ChildProcess, EnvironmentAdapter } from '../core/environmentAdapter'
import { log } from '../core/logService';

export class BrowserEnvironmentAdapter implements EnvironmentAdapter {

	public runShellCommand(command: string): ChildProcess {
		throw new Error('Method not implemented.');
	}

	public async openFile(path: string): Promise<void> {
		throw new Error(`BrowserEnvironmentAdapter::openFile(path: '${path}'): Not supported in BrowserEnvironment.`);
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