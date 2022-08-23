import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'

export abstract class ApplicationMenu {
  
    public abstract initAndRender(): Promise<void>
  
    public abstract addMenuItemToPlugins(menuItem: MenuItemFile|MenuItemFolder): void
  
    public abstract addMenuItemTo(parentMenuItemId: string, menuItem: MenuItemFile|MenuItemFolder): void

    public abstract setMenuItemEnabled(menuItem: MenuItemFile|MenuItemFolder, enabled: boolean): Promise<void>
  
  }