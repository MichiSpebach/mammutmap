import { MenuItem } from './MenuItem'

export class MenuItemFolder extends MenuItem {
    public readonly submenu: MenuItem[]

    public constructor(params: {id?: string, label: string, enabled?: boolean, submenu: MenuItem[]}) {
        super(params)
        this.submenu = params.submenu
    }

    public findMenuItemById(id: string): MenuItem|undefined {
        let matchingItem: MenuItem|undefined = this.submenu.find(item => item.id === id)

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