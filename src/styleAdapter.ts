
interface Style {
  getBoxBorderClass(mapDataFileExisting: boolean): string
  getHighlightClass(): string
  getLinkColor(): string
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

  public getLinkColor(): string {
    return '#2060c0'
  }

}

export const style: Style = new DarkTheme()
