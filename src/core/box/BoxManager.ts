import { util } from '../util/util'
import { Box } from './Box'

export class BoxManager {
  private boxes: Map<string, Box> = new Map()

  public getNumberOfBoxes(): number {
    return this.boxes.size
  }

  public addBox(box: Box): void {
    if (this.boxes.has(box.getId())) {
      util.logWarning('trying to add box with id '+box.getId()+' that is already contained by BoxManager.');
    }
    this.boxes.set(box.getId(), box)
  }

  public removeBox(box: Box): void {
    if (!this.boxes.has(box.getId())) {
      util.logWarning('trying to remove box with id '+box.getId()+' that is not contained by BoxManager.');
    }
    this.boxes.delete(box.getId())
  }

  public getBox(id: string): Box|never {
    const box: Box|undefined = this.boxes.get(id)
    if (box === undefined) {
      util.logError('box with id '+id+' does not exist or is not registered in BoxManager.')
    }
    return box
  }

  public getBoxIfExists(id: string): Box|undefined {
    return this.boxes.get(id);
  }

}

export let boxManager: BoxManager = new BoxManager()

export function init(object: BoxManager): void {
  boxManager = object
}
