import { ApplicationMenu } from './applicationMenu/applicationMenu'
import { ElectronAndHtmlApplicationMenu } from './applicationMenu/ElectronAndHtmlApplicationMenu'
import { ElectronApplicationMenu } from './applicationMenu/ElectronApplicationMenu'

// TODO: move into applicationMenu folder or context file?
export let applicationMenu: ApplicationMenu = new ElectronApplicationMenu()
