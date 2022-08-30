import { applicationMenu, MenuItemFile } from '../dist/pluginFacade'
import { WizardWidget } from './pactCycleDetector/WizardWidget'

applicationMenu.addMenuItemTo('pactCycleDetector.js', new MenuItemFile({label: 'detect...', click: openWizard}))

async function openWizard(): Promise<void> {
    new WizardWidget().render()
}
