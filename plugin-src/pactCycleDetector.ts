import { MenuItem } from 'electron'
import * as applicationMenu from '../dist/applicationMenu'
import { WizardWidget } from './pactCycleDetector/WizardWidget'

applicationMenu.addMenuItemTo('pactCycleDetector.js', new MenuItem({label: 'detect...', click: openWizard}))

async function openWizard(): Promise<void> {
    new WizardWidget().render()
}
