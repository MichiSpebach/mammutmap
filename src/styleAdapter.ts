
interface Style {
  getBoxBorderClass(mapDataFileExisting: boolean): string
  getHighlightClass(): string
}

class DarkTheme implements Style {

  public getBoxBorderClass(mapDataFileExisting: boolean): string {
    if (mapDataFileExisting) {
      return "boxBorder"
    } else {
      return "boxBorderNoMapData"
    }
  }

  public getHighlightClass(): string {
    return 'highlight'
  }

}

export const style: Style = new DarkTheme()
