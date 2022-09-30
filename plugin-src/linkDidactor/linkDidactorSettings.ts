import * as pluginFacade from '../../dist/pluginFacade'
import { Message, Map, onMapLoaded, onMapUnload, Subscribers } from '../../dist/pluginFacade'
import { util } from '../../dist/util'
import { DidactedLinkTag, LinkTagMode } from './DidactedLinkTag'

export const linkTags: Subscribers<DidactedLinkTag[]|Message> = new Subscribers()

onMapLoaded.subscribe(async (map: Map) => {
    map.getProjectSettings().linkTags.subscribe(() => linkTags.callSubscribers(getLinkTags()))
    await linkTags.callSubscribers(getLinkTags())
})

onMapUnload.subscribe(() => linkTags.callSubscribers(getLinkTags()))

export function getComputedModeForLinkTag(tagName: string): LinkTagMode {
    const tag: DidactedLinkTag|undefined = findLinkTagByName(tagName)
    if (!tag) {
        util.logWarning('cannot getComputedModeForLinkTag because no LinkTag with name '+tagName+' found, returning visible as default')
        return 'visible'
    }
    return tag.getMode()
}

function findLinkTagByName(tagName: string): DidactedLinkTag|undefined {
    return getLinkTagsOrWarn().find(tag => tag.getName() === tagName)
}

function getLinkTagsOrWarn(): DidactedLinkTag[] {
    const tagsOrMessage: DidactedLinkTag[]|Message = getLinkTags()
    if (tagsOrMessage instanceof Message) {
        util.logWarning('Failed to getLinkTagsOrWarn(), returning empty list. Reason: '+tagsOrMessage.message)
        return []
    }
    return tagsOrMessage
}

export function getLinkTags(): DidactedLinkTag[]|Message {
    const mapOrMessage: Map|Message = pluginFacade.getMap()
    if (mapOrMessage instanceof Message) {
        return mapOrMessage
    }
    return mapOrMessage.getProjectSettings().getLinkTags().map(tagData => new DidactedLinkTag(tagData))
}

export async function saveToFileSystem(): Promise<void> {
    const mapOrMessage: Map|Message = pluginFacade.getMap()
    if (mapOrMessage instanceof Message) {
        return util.logWarning('Failed to saveToFileSystem, reason: '+mapOrMessage.message)
    }
    await mapOrMessage.getProjectSettings().saveToFileSystem()
}
