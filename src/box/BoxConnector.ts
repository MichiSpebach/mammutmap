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

    dom.addEventListenerTo(this.getId(), 'click', (clientX: number, clientY: number) => BoxConnector.addLinkToBox(this.referenceBox, clientX, clientY))
  }

  public static async addLinkToBox(box: Box, clientX: number, clientY: number): Promise<void> {
    const localPosition: {x: number, y: number} = await box.transformClientPositionToLocal(clientX, clientY)
    const from = new WayPointData(box.getId(), box.getName(), localPosition.x, localPosition.y)

    const rightMiddle: {x: number, y: number} = box.transformLocalToParent(localPosition.x, localPosition.y)
    const to = new WayPointData(box.getParent().getId(), box.getParent().getName(), rightMiddle.x + 5, rightMiddle.y)

    box.getParent().addLink(from, to)
  }

}
