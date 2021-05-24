import * as util from '../util'
import { Box } from './Box'

class BoxManager {
  private boxes: Map<string, Box> = new Map()

  public addBox(box: Box): void {
    if (this.boxes.has(box.getId())) {
      util.logWarning('box with id '+box.getId()+' already contained by BoxManager.');
    }
    this.boxes.set(box.getId(), box)
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

export const boxManager: BoxManager = new BoxManager()
