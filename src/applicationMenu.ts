import { ApplicationMenu } from './applicationMenu/ApplicationMenu'
import { ElectronAndHtmlApplicationMenu } from './applicationMenu/ElectronAndHtmlApplicationMenu'

// TODO: move into applicationMenu folder or context file?
export let applicationMenu: ApplicationMenu = new ElectronAndHtmlApplicationMenu()
