import { style } from '../../styleAdapter'
import { BoxHeader } from './BoxHeader'

export class SourcelessBoxHeader extends BoxHeader {

  protected override getInnerStyleClassNames(): string[] {
    const classNames: string[] = super.getInnerStyleClassNames()
    classNames.push(style.getSourcelessBoxHeaderInnerClass())
    return classNames
  }

}
