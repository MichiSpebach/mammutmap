import { Menu as ElectronMenu } from 'electron'
import { MenuItem } from '../applicationMenu/MenuItem'

export class ElectronContextMenu {

    private readonly items: MenuItem[]

    public constructor(items: MenuItem[]) {
        this.items = items
    }

    public popup(): void {
        ElectronMenu.buildFromTemplate(this.items).popup()
    }

}