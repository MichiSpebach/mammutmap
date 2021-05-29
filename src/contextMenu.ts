import { Menu } from 'electron'
import * as util from './util'
import { FileBox } from './box/FileBox';

export function openForFileBox(box: FileBox): void {
  const atomCommand: string = 'atom '+box.getSrcPath()
  const template: any = [
    {
      label: 'run '+atomCommand,
      click: () => {
        util.runShellCommand(atomCommand)
      }
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  menu.popup()
}
