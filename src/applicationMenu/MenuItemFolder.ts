import { MenuItem } from "./MenuItem"
import { MenuItemFile } from "./MenuItemFile"

export class MenuItemFolder extends MenuItem {
    public readonly submenu: (MenuItemFile|MenuItemFolder)[]

    public constructor(params: {id?: string, label: string, enabled?: boolean, submenu: (MenuItemFile|MenuItemFolder)[]}) {
        super(params)
        this.submenu = params.submenu
    }

    public findMenuItemById(id: string): MenuItemFile|MenuItemFolder|undefined {
        let matchingItem: MenuItemFile|MenuItemFolder|undefined = this.submenu.find(item => item.id === id)

        for (const item of this.submenu) {
            if (matchingItem) {
                break
            }
            if (item instanceof MenuItemFolder) {
                matchingItem = item.findMenuItemById(id)
            }
        }
        
        return matchingItem
    }

}