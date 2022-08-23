import { util } from '../util'

export class MenuItemFile {
    public readonly id: string
    public readonly label: string
    public readonly click: () => void|Promise<void>

    public constructor(params: {id?: string, label: string, click: () => void|Promise<void>}) {
        if (params.id) {
            this.id = params.id
        } else {
            this.id = params.label+util.generateId()
        }
        this.label = params.label
        this.click = params.click
    }

}