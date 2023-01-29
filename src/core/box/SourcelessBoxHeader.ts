import { style } from '../styleAdapter'
import { renderManager } from '../RenderManager'
import { BoxHeader } from './BoxHeader'

export class SourcelessBoxHeader extends BoxHeader {

  public async render(): Promise<void> {
    await super.render()
    renderManager.addClassTo(super.getId(), style.getSourcelessBoxHeaderClass())
  }

}
