import { MenuItemFile } from "./MenuItemFile"

export class MenuItemFolder {
    public readonly id: string
    public readonly label: string
    public readonly submenu: (MenuItemFile|MenuItemFolder)[]

    public constructor(id: string, label: string, submenu: (MenuItemFile|MenuItemFolder)[]) {
        this.id = id
        this.label = label
        this.submenu = submenu
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