import { ApplicationMenu } from './applicationMenu'
import { ElectronApplicationMenu } from './ElectronApplicationMenu'
import { HtmlApplicationMenu } from './HtmlApplicationMenu'
import { MenuItem } from 'electron'

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
  
    public addMenuItemToPlugins(menuItem: MenuItem): void {
        this.electronApplicationMenu.addMenuItemToPlugins(menuItem)
        this.htmlApplicatioinMenu.addMenuItemToPlugins(menuItem)
    }
  
    public addMenuItemTo(parentMenuItemId: string, menuItem: MenuItem): void {
        this.electronApplicationMenu.addMenuItemTo(parentMenuItemId, menuItem)
        this.htmlApplicatioinMenu.addMenuItemTo(parentMenuItemId, menuItem)
    }
    
  }