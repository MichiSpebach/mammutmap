import { MenuItem } from './MenuItem'

export class MenuItemFolder extends MenuItem {
    public readonly preferredOpenDirection: 'right'|'bottom'
    public readonly submenu: MenuItem[]

    public constructor(options: {id?: string, label: string, enabled?: boolean, preferredOpenDirection?: 'right'|'bottom', submenu: MenuItem[]}) {
        super(options)
        this.preferredOpenDirection = options.preferredOpenDirection ?? 'right'
        this.submenu = options.submenu
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