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

}