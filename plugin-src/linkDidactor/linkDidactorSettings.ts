import * as pluginFacade from '../../dist/pluginFacade'
import { Message, Map, onMapLoaded, onMapUnload, Subscribers } from '../../dist/pluginFacade'
import { util } from '../../dist/util'
import { LinkAppearanceData, LinkAppearanceMode } from '../../dist/mapData/LinkAppearanceData'
import { LinkTagData } from '../../dist/mapData/LinkTagData'

export const linkTags: Subscribers<LinkTagData[]|Message> = new Subscribers()

onMapLoaded.subscribe(async (map: Map) => {
    map.getProjectSettings().linkTags.subscribe(() => linkTags.callSubscribers(getLinkTags()))
    await linkTags.callSubscribers(getLinkTags())
})

onMapUnload.subscribe(() => linkTags.callSubscribers(getLinkTags()))

let defaultLinkAppearance: LinkAppearanceData = new LinkAppearanceData('visibleEnds')

export function getComputedModeForLinkTags(tagNames: string[]|undefined): LinkAppearanceMode {
    if (!tagNames || tagNames.length === 0) {
        return defaultLinkAppearance.getMode()
    }

    let mostImportantTag: LinkTagData|undefined = undefined
    let maxIndex: number = -1
    
    const linkTags: LinkTagData[] = getLinkTagsOrWarn()
    for (const tagName of tagNames) {
        const index = linkTags.findIndex(tag => tag.name === tagName)
        if (index > maxIndex) {
            mostImportantTag = linkTags[index]
            maxIndex = index
        }
    }
    
    if (!mostImportantTag) {
        util.logWarning('Cannot getComputedModeForLinkTags because no LinkTag with name in ['+tagNames+'] found, returning visible as default.')
        return 'visible'
    }
    return mostImportantTag.appearance.getMode()
}

function getLinkTagsOrWarn(): LinkTagData[] {
    const tagsOrMessage: LinkTagData[]|Message = getLinkTags()
    if (tagsOrMessage instanceof Message) {
        util.logWarning('Failed to getLinkTagsOrWarn(), returning empty list. Reason: '+tagsOrMessage.message)
        return []
    }
    return tagsOrMessage
}

export function getDefaultLinkAppereance(): LinkAppearanceData {
    return defaultLinkAppearance
}

export function getLinkTags(): LinkTagData[]|Message {
    const mapOrMessage: Map|Message = pluginFacade.getMap()
    if (mapOrMessage instanceof Message) {
        return mapOrMessage
    }
    return mapOrMessage.getProjectSettings().getLinkTags()
}

export function setDefaultLinkModeAndSaveToFileSystem(mode: LinkAppearanceMode): Promise<void> {
    defaultLinkAppearance.setMode(mode)
    // TODO implement
    return Promise.resolve()
}

export async function saveToFileSystem(): Promise<void> {
    const mapOrMessage: Map|Message = pluginFacade.getMap()
    if (mapOrMessage instanceof Message) {
        return util.logWarning('Failed to saveToFileSystem, reason: '+mapOrMessage.message)
    }
    await mapOrMessage.getProjectSettings().saveToFileSystem()
}
