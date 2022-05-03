import * as indexHtmlIds from './indexHtmlIds'
import { renderManager } from './RenderManager'

interface Style {
  getHintClass(): string
  getPopupClass(): string
  getFileBoxBackgroundClass(): string
  getFolderBoxBackgroundClass(): string
  getSourcelessBoxBackgroundClass(): string

  getBoxBorderClass(): string
  getAdditionalBoxBorderClass(mapDataFileExisting: boolean): string

  getBoxHeaderClass(): string
  getFileBoxHeaderClass(): string
  getFolderBoxHeaderClass(): string
  getSourcelessBoxHeaderClass(): string

  getBoxHeaderInnerClass(): string
  getBoxBodyZoomInToRenderHintClass(): string
  getBoxBodyZoomInToRenderHintTextClass(): string
  getFileBoxBodyTextClass(): string

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

  public getPopupClass(): string {
    return 'popup'
  }

  public getFileBoxBackgroundClass(): string {
    return 'fileBoxBackground'
  }
  public getFolderBoxBackgroundClass(): string {
    return 'folderBoxBackground'
  }
  public getSourcelessBoxBackgroundClass(): string {
    return 'sourcelessBoxBackground'
  }

  public getBoxBorderClass(): string {
    return 'boxBorder'
  }
  public getAdditionalBoxBorderClass(mapDataFileExisting: boolean): string {
    if (mapDataFileExisting) {
      return 'boxBorderWithMapData'
    } else {
      return 'boxBorderWithoutMapData'
    }
  }

  public getBoxHeaderClass(): string {
    return 'boxHeader'
  }
  public getFileBoxHeaderClass(): string {
    return 'fileBoxHeader'
  }
  public getFolderBoxHeaderClass(): string {
    return 'folderBoxHeader'
  }
  public getSourcelessBoxHeaderClass(): string {
    return 'sourcelessBoxHeader'
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

class CompatibilityTheme extends DarkTheme {

  public static async new(): Promise<CompatibilityTheme> {
    let additionalStyleSheets = '<link href="../node_modules/@fontsource/source-sans-pro/400.css" rel="stylesheet" type="text/css">'
    additionalStyleSheets += '<link href="../node_modules/@fontsource/source-code-pro/400.css" rel="stylesheet" type="text/css">'
    await renderManager.addContentTo(indexHtmlIds.headId, additionalStyleSheets)
    return new CompatibilityTheme()
  }

  public getHighlightTransitionClass(): string {
    return ''
  }
}

export async function setCompatibilityTheme(): Promise<void> {
  style = await CompatibilityTheme.new()
}

export let style: Style = new DarkTheme()
