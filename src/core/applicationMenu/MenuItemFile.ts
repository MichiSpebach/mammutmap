import { MenuItem } from './MenuItem'

export class MenuItemFile extends MenuItem {
    public readonly click: () => void|Promise<void>
    //public readonly stayOpenWhenClicked: boolean TODO: for toggles e.g. linkTags this option would be convenient

    public constructor(params: {id?: string, label: string, enabled?: boolean, click: () => void|Promise<void>}) {
        super(params)
        this.click = params.click
    }

}