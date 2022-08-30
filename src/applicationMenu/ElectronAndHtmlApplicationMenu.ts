import { ApplicationMenu } from './ApplicationMenu'
import { ElectronApplicationMenu } from './ElectronApplicationMenu'
import { HtmlApplicationMenu } from './HtmlApplicationMenu'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'

export class ElectronAndHtmlApplicationMenu extends ApplicationMenu {
    private readonly electronApplicationMenu: ElectronApplicationMenu
    private readonly htmlApplicatioinMenu: HtmlApplicationMenu

    public constructor() {
        super()
        this.electronApplicationMenu = new ElectronApplicationMenu()
        this.htmlApplicatioinMenu = new HtmlApplicationMenu()
    }

    public async initAndRender(): Promise<void> {
        await Promise.all([
            this.electronApplicationMenu.initAndRender(),
            this.htmlApplicatioinMenu.initAndRender()
        ])
    }

    protected afterAddMenuItemTo(parentMenuItem: MenuItemFolder, menuItem: MenuItemFile|MenuItemFolder): void {
        this.electronApplicationMenu.addMenuItemTo(parentMenuItem.id, menuItem)
        this.htmlApplicatioinMenu.addMenuItemTo(parentMenuItem.id, menuItem)
    }

    protected async afterSetMenuItemEnabled(menuItem: MenuItemFile | MenuItemFolder, enabled: boolean): Promise<void> {
        await Promise.all([
            this.electronApplicationMenu.setMenuItemEnabled(menuItem, enabled),
            this.htmlApplicatioinMenu.setMenuItemEnabled(menuItem, enabled)
        ])
    }

  }
