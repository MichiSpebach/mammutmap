import { Box } from './core/box/Box'
import { FileBox } from './core/box/FileBox'
import { FolderBox } from './core/box/FolderBox'
import { RootFolderBox } from './core/box/RootFolderBox'
import { Map, map, onMapLoaded, onMapRendered, onMapUnload } from './core/Map'
import { util } from './core/util/util'
import { ChildProcess, environment } from './core/environmentAdapter'
import { WayPointData } from './core/mapData/WayPointData'
import { BoxWatcher } from './core/box/BoxWatcher'
import * as boxFinder from './core/pluginUtil/boxFinder'
import { Link, LinkImplementation, override as overrideLink } from './core/link/Link'
import { applicationMenu } from './core/applicationMenu/applicationMenu'
import { MenuItemFile } from './core/applicationMenu/MenuItemFile'
import * as contextMenu from './core/contextMenu'
import { Subscribers } from './core/util/Subscribers'
import { renderManager, RenderPriority } from './core/RenderManager'
import { LinkLine, LinkLineImplementation, override as overrideLinkLine } from './core/link/LinkLine'
import { ProjectSettings } from './core/ProjectSettings'
import { mainWidget } from './core/mainWidget'
import { BoxHeader } from './core/box/header/BoxHeader'
import { Transform } from './core/box/Transform'
import { LocalPosition } from './core/shape/LocalPosition'
import { LinkAppearanceData, LinkAppearanceMode, linkAppearanceModes } from './core/mapData/LinkAppearanceData'
import { style } from './core/styleAdapter'
import { BorderingLinks } from './core/link/BorderingLinks'
import { NodeWidget } from './core/node/NodeWidget'
import { LinkTagData } from './core/mapData/LinkTagData'
import { ToolbarView } from './core/toolbars/ToolbarView'
import { Widget } from './core/Widget'
import { ElementType, RenderElement, RenderElements, Style } from './core/util/RenderElement'
import { PopupWidget } from './core/PopupWidget'
import { TextInputPopup } from './core/TextInputPopup';
import { settings } from './core/settings/settings'
import { log } from './core/logService'
import { BoxLinks } from './core/box/BoxLinks'
import { MenuItemFolder } from './core/applicationMenu/MenuItemFolder'
import { FileBoxDepthTreeIterator } from './core/box/FileBoxDepthTreeIterator'
import { BoxDepthTreeIterator } from './core/box/BoxDepthTreeIterator'
import { ProgressBarWidget } from './core/util/ProgressBarWidget'


export { util as coreUtil }
export { environment, ChildProcess }
export { applicationMenu, contextMenu, MenuItemFile, MenuItemFolder }
export { renderManager, RenderPriority, Subscribers }
export { RenderElements, RenderElement, ElementType, Style }
export { style }
export { Widget }
export { PopupWidget, TextInputPopup }
export { ProgressBarWidget };
export { mainWidget }
export { ToolbarView }
export { Map, onMapLoaded, onMapRendered, onMapUnload }
export { ProjectSettings }
export { settings as applicationSettings }
export { LinkAppearanceData, LinkAppearanceMode, linkAppearanceModes }
export { LinkTagData }
export { WayPointData }
export { Transform, LocalPosition }
export { BoxDepthTreeIterator, FileBoxDepthTreeIterator }
export { BoxWatcher }
export { Box, FileBox, RootFolderBox }
export { BoxHeader }
export { BorderingLinks }
export { Link, LinkImplementation, overrideLink }
export { LinkLine, LinkLineImplementation, overrideLinkLine }
export { NodeWidget }
export { log }

export class Message {
  public constructor(
    public message: string
  ) { }
}

export function getFileBoxIterator(): FileBoxDepthTreeIterator {
  return new FileBoxDepthTreeIterator(getRootFolder())
}

export function getRootFolder(): RootFolderBox | never {
  return getMapOrError().getRootFolder()
}

export function getMapOrError(): Map | never {
  if (!map) {
    util.logError('a folder has to be openend first to execute this plugin')
  }
  return map
}

export function getMap(): Map | Message {
  if (!map) {
    return new Message('No folder/project/map opened.')
  }
  return map
}

export async function addLink(fromBox: FileBox, toFilePath: string, options?: {
  onlyReturnWarnings?: boolean
  delayUnwatchingOfBoxesInMS?: number
}): Promise<{
  linkRoute: Link[]|undefined,
  linkRouteAlreadyExisted: boolean,
  warnings?: string[]
}> {
  const toReport = await findBoxBySourcePath(toFilePath, fromBox.getParent(), options)
  if (!toReport.boxWatcher) {
    const message: string = 'failed to add link because file for toFilePath "' + toFilePath + '" was not found'
    if (!options?.onlyReturnWarnings) {
      util.logWarning(message)
    }
    const warnings: string[] = toReport.warnings ? toReport.warnings.concat(message) : [message]
    return { linkRoute: undefined, linkRouteAlreadyExisted: false, warnings }
  }

  const toBox: Box = await toReport.boxWatcher.get()

  const { linkRoute, linkRouteAlreadyExisted } = await addLinkBetweenBoxes(fromBox, toBox)

  if (options?.delayUnwatchingOfBoxesInMS) {
    setTimeout(() => toReport.boxWatcher!.unwatch(), options.delayUnwatchingOfBoxesInMS)
  } else {
    toReport.boxWatcher.unwatch()
  }

  return { linkRoute, linkRouteAlreadyExisted, warnings: toReport.warnings }
}

export async function addLinkBetweenBoxes(fromBox: Box, toBox: Box): Promise<{
  linkRoute: Link[]|undefined,
  linkRouteAlreadyExisted: boolean
}> {
  const managingBox: Box = Box.findCommonAncestor(fromBox, toBox).commonAncestor;

  let linkRoute: Link[]|undefined = BoxLinks.findLinkRoute(fromBox, toBox)
  const linkRouteAlreadyExisted: boolean = !!linkRoute
  if (!linkRoute) {
    const link: Link = await managingBox.links.add({from: fromBox, to: toBox, save: true})
    await link.setAutoMaintained(true)
    linkRoute = [link]
  }

  return { linkRoute, linkRouteAlreadyExisted }
}

export async function findBoxBySourcePath(
  path: string,
  baseOfPath: FolderBox,
  options?: {onlyReturnWarnings?: boolean}
): Promise<{ boxWatcher?: BoxWatcher, warnings?: string[] }> {
  return boxFinder.findBox(path, baseOfPath, options)
}
