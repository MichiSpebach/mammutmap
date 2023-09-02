import { style } from '../styleAdapter'
import { renderManager } from '../RenderManager'
import { BoxHeader } from './BoxHeader'

export class SourcelessBoxHeader extends BoxHeader {

  protected override getInnerStyleClassNames(): string[] {
    const classNames: string[] = super.getInnerStyleClassNames()
    classNames.push(style.getSourcelessBoxHeaderInnerClass())
    return classNames
  }

}
