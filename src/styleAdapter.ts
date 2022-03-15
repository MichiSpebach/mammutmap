
interface Style {
  getHintClass(): string
  getFileBoxClass(): string
  getFolderBoxClass(): string
  getFileBoxHeaderClass(): string
  getFolderBoxHeaderClass(): string
  getBoxHeaderInnerClass(): string
  getBoxBodyZoomInToRenderHintClass(): string
  getBoxBodyZoomInToRenderHintTextClass(): string
  getFileBoxBodyTextClass(): string
  getBoxBorderLineClass(mapDataFileExisting: boolean): string
  getHorizontalResizeClass(): string
  getVerticalResizeClass(): string
  getDiagonalResizeClass(): string
  getHighlightTransitionClass(): string
  getHighlightClass(): string
  getLinkColor(): string
}

class DarkTheme implements Style {

  public getHintClass(): string {
    return 'hint'
  }

  public getFileBoxClass(): string {
    return 'fileBox'
  }

  public getFolderBoxClass(): string {
    return 'folderBox'
  }

  public getFileBoxHeaderClass(): string {
    return 'fileBoxHeader'
  }

  public getFolderBoxHeaderClass(): string {
    return 'folderBoxHeader'
  }

  public getBoxHeaderInnerClass(): string {
    return 'boxHeaderInner'
  }

  public getBoxBodyZoomInToRenderHintClass(): string {
    return 'boxBodyZoomInToRenderHint'
  }

  public getBoxBodyZoomInToRenderHintTextClass(): string {
    return 'boxBodyZoomInToRenderHintText'
  }

  public getFileBoxBodyTextClass(): string {
    return 'fileBoxBodyText'
  }

  public getBoxBorderLineClass(mapDataFileExisting: boolean): string {
    if (mapDataFileExisting) {
      return 'boxBorderLine'
    } else {
      return 'boxBorderLineNoMapData'
    }
  }

  public getHorizontalResizeClass(): string {
    return 'ewResize'
  }
  public getVerticalResizeClass(): string {
    return 'nsResize'
  }
  public getDiagonalResizeClass(): string {
    return 'nwseResize'
  }

  public getHighlightTransitionClass(): string {
    return 'highlightTransition'
  }

  public getHighlightClass(): string {
    return 'highlight'
  }

  public getLinkColor(): string {
    return '#2060c0'
  }

}

export let style: Style = new DarkTheme()
