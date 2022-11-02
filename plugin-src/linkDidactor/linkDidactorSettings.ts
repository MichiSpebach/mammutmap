import * as pluginFacade from '../../dist/pluginFacade'
import { Message, Map, onMapLoaded, onMapUnload, Subscribers } from '../../dist/pluginFacade'
import { util } from '../../dist/util'
import { LinkAppearanceData, LinkAppearanceMode } from '../../dist/mapData/LinkAppearanceData'
import { LinkTagData } from '../../dist/mapData/LinkTagData'
import { style } from '../../dist/styleAdapter'

export const linkColors: string[] = ['red', 'green', 'blue', 'yellow', 'orange', 'magenta', 'aqua', 'lime', 'purple', 'teal', style.getLinkColor()]
export const boxIdHashColorName = 'boxId hash'
export const linkColorOptions: string[] = [...linkColors, boxIdHashColorName]

export const linkTags: Subscribers<LinkTagData[]|Message> = new Subscribers()

onMapLoaded.subscribe(async (map: Map) => {
    map.getProjectSettings().linkTags.subscribe(() => linkTags.callSubscribers(getLinkTags()))
    await linkTags.callSubscribers(getLinkTags())
})

onMapUnload.subscribe(() => linkTags.callSubscribers(getLinkTags()))

export function getComputedModeForLinkTags(tagNames: string[]|undefined): LinkAppearanceMode {
    let mostImportantMode: LinkAppearanceMode = getDefaultLinkAppereanceMode()

    if (!tagNames || tagNames.length === 0) {
        return mostImportantMode
    }
    
    for (const linkTag of getLinkTagsSortedByIndex(tagNames)) {
        if (linkTag.appearance.mode) {
            mostImportantMode = linkTag.appearance.mode
        }
    }
    
    return mostImportantMode
}

export function getComputedColorForLinkTags(tagNames: string[]|undefined): string {
    let mostImportantColor: string = getDefaultLinkAppereanceColor()

    if (!tagNames || tagNames.length === 0) {
        return mostImportantColor
    }
    
    for (const linkTag of getLinkTagsSortedByIndex(tagNames)) {
        if (linkTag.appearance.color) {
            mostImportantColor = linkTag.appearance.color
        }
    }
    
    return mostImportantColor
}

function getLinkTagsSortedByIndex(tagNames: string[]): LinkTagData[] {
    return getLinkTagsOrWarn().filter(tag => tagNames.includes(tag.name))
}

function getLinkTagsOrWarn(): LinkTagData[] {
    const tagsOrMessage: LinkTagData[]|Message = getLinkTags()
    if (tagsOrMessage instanceof Message) {
        util.logWarning('Failed to getLinkTagsOrWarn(), returning empty list. Reason: '+tagsOrMessage.message)
        return []
    }
    return tagsOrMessage
}

export function getDefaultLinkAppereanceMode(): LinkAppearanceMode {
    return getDefaultLinkAppereance().mode ?? 'visible'
}

export function getDefaultLinkAppereanceColor(): string {
    return getDefaultLinkAppereance().color ?? style.getLinkColor()
}

function getDefaultLinkAppereance(): LinkAppearanceData {
    return pluginFacade.getMapOrError().getProjectSettings().getDefaultLinkAppearance()
}

export async function setDefaultLinkAppereanceModeAndSave(mode: LinkAppearanceMode|undefined): Promise<void> {
    getDefaultLinkAppereance().mode = mode
    await saveToFileSystem()
}

export async function setDefaultLinkAppereanceColorAndSave(color: string|undefined): Promise<void> {
    getDefaultLinkAppereance().color = color
    await saveToFileSystem()
}

export function getLinkTags(): LinkTagData[]|Message {
    const mapOrMessage: Map|Message = pluginFacade.getMap()
    if (mapOrMessage instanceof Message) {
        return mapOrMessage
    }
    return mapOrMessage.getProjectSettings().getLinkTags()
}

export async function saveToFileSystem(): Promise<void> {
    const mapOrMessage: Map|Message = pluginFacade.getMap()
    if (mapOrMessage instanceof Message) {
        return util.logWarning('Failed to saveToFileSystem, reason: '+mapOrMessage.message)
    }
    await mapOrMessage.getProjectSettings().saveToFileSystem()
}
