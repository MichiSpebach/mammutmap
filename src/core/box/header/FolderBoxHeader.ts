import { style } from '../../styleAdapter'
import { BoxHeader } from './BoxHeader'
import { Box } from '../Box'

export class FolderBoxHeader extends BoxHeader {

  public constructor(referenceBox: Box) {
    super(referenceBox)
  }

  protected override getInnerStyleClassNames(): string[] {
    const classNames: string[] = super.getInnerStyleClassNames()
    classNames.push(style.getFolderBoxHeaderInnerClass())
    return classNames
  }

}
