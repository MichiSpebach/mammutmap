import * as dom from '../domAdapter'
import { Draggable } from "../Draggable";
import { DragManager } from '../DragManager'
import { Box } from "./Box";
import { WayPointData } from './WayPointData'

export class BoxConnector {
  private readonly referenceBox: Box

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public getId(): string {
    return this.referenceBox.getId()+'connector'
  }

  public async render(): Promise<void> {
    await dom.addClassTo(this.getId(), 'boxConnector')

    dom.addClickListenerTo(this.getId(), () => {
      const from = new WayPointData(this.referenceBox.getId(), 100, 50)

      const rightMiddle: {x: number, y: number} = this.referenceBox.transformLocalToParent(100, 50)
      const to = new WayPointData(WayPointData.THIS_BOX_ID, rightMiddle.x + 5, rightMiddle.y)

      this.referenceBox.getParent().addLink(from, to)
    })
  }

}
