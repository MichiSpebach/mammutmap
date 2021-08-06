import { MenuItem } from 'electron'
import * as util from '../dist/util'
import * as applicationMenu from '../dist/applicationMenu'

util.logInfo('hello world')

applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Join on GitHub (coming soon)'}))
