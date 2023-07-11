import { ProjectSettings } from '../ProjectSettings'
import { ClientRect } from '../ClientRect'

export interface BoxContext {
    readonly projectSettings: ProjectSettings
    readonly getMapClientRect: () => Promise<ClientRect>
}