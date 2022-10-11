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

export function getComputedModeForLinkTags(tagNames: string[]): LinkTagMode {
    let mostImportantTag: DidactedLinkTag|undefined = undefined
    let maxIndex: number = -1
    
    const linkTags: DidactedLinkTag[] = getLinkTagsOrWarn()
    for (const tagName of tagNames) {
        const index = linkTags.findIndex(tag => tag.getName() === tagName)
        if (index > maxIndex) {
            mostImportantTag = linkTags[index]
            maxIndex = index
        }
    }
    
    if (!mostImportantTag) {
        util.logWarning('Cannot getComputedModeForLinkTags because no LinkTag with name in ['+tagNames+'] found, returning visible as default.')
        return 'visible'
    }
    return mostImportantTag.getMode()
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
