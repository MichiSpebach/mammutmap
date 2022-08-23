import { ApplicationMenu } from './applicationMenu'
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
  
    public addMenuItemToPlugins(menuItem: MenuItemFile|MenuItemFolder): void {
        this.electronApplicationMenu.addMenuItemToPlugins(menuItem)
        this.htmlApplicatioinMenu.addMenuItemToPlugins(menuItem)
    }
  
    public addMenuItemTo(parentMenuItemId: string, menuItem: MenuItemFile|MenuItemFolder): void {
        this.electronApplicationMenu.addMenuItemTo(parentMenuItemId, menuItem)
        this.htmlApplicatioinMenu.addMenuItemTo(parentMenuItemId, menuItem)
    }

    public async setMenuItemEnabled(menuItem: MenuItemFile | MenuItemFolder, enabled: boolean): Promise<void> {
        await Promise.all([
            this.electronApplicationMenu.setMenuItemEnabled(menuItem, enabled),
            this.htmlApplicatioinMenu.setMenuItemEnabled(menuItem, enabled)
        ])
    }
    
  }