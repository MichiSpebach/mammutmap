import * as pluginFacade from '../../dist/pluginFacade'
import { Message, Map, subscribeMap, Subscribers } from '../../dist/pluginFacade'
import { util } from '../../dist/util'
import { DidactedLinkTag, LinkTagMode } from './DidactedLinkTag'

export const linkTagSubscribers: Subscribers<DidactedLinkTag[]|Message> = new Subscribers()

subscribeMap(onMapLoaded, onMapUnloaded)

function onMapLoaded(map: Map): void {
    map.getProjectSettings().linkTagSubscribers.subscribe(() => linkTagSubscribers.call(getLinkTags()))
    linkTagSubscribers.call(getLinkTags())
}

function onMapUnloaded(): void {
    linkTagSubscribers.call(getLinkTags())
}

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
