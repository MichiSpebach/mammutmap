import { util } from '../util/util'

export abstract class MenuItem {
    public readonly id: string
    public readonly label: string
    public enabled: boolean

    public constructor(params: {id?: string, label: string, enabled?: boolean}) {
        if (params.id) {
            this.id = params.id
        } else {
            this.id = params.label+util.generateId()
        }
        
        this.label = params.label

        if (params.enabled === undefined) {
            this.enabled = true
        } else {
            this.enabled = params.enabled
        }
    }

}