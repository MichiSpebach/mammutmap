import { MenuItem } from 'electron'

export abstract class ApplicationMenu {
  
    public abstract initAndRender(): Promise<void>
  
    public abstract addMenuItemToPlugins(menuItem: MenuItem): void // TODO change type of menuItem
  
    public abstract addMenuItemTo(parentMenuItemId: string, menuItem: MenuItem): void // TODO change type of menuItem
  
  }