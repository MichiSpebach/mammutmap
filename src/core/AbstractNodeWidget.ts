import { Widget } from './Widget'

export abstract class AbstractNodeWidget /*TODO extends Widget*/ { // TODO: rename to NodeWidget

    public isRoot(): boolean {
        return false // TODO: replace with !this.parent?
    }

}