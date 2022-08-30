import { MenuItem } from './MenuItem'

export class MenuItemFile extends MenuItem {
    public readonly click: () => void|Promise<void>

    public constructor(params: {id?: string, label: string, enabled?: boolean, click: () => void|Promise<void>}) {
        super(params)
        this.click = params.click
    }

}