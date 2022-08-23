import { MenuItemFile } from '../dist/applicationMenu/MenuItemFile'
import { applicationMenu } from '../dist/applicationMenu'
import { WizardWidget } from './pactCycleDetector/WizardWidget'

applicationMenu.addMenuItemTo('pactCycleDetector.js', new MenuItemFile({label: 'detect...', click: openWizard}))

async function openWizard(): Promise<void> {
    new WizardWidget().render()
}
