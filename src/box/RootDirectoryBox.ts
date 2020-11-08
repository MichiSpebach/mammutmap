import { DirectoryBox } from './DirectoryBox'
import { Path } from '../Path'

export class RootDirectoryBox extends DirectoryBox {

  public constructor(path: Path, id: string) {
    super(path, id, null)
  }

}
