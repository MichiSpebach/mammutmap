import * as pluginFacade from '../../dist/pluginFacade'
import { util } from '../../dist/util'
import { DidactedLinkTag, LinkTagMode } from './DidactedLinkTag'

export function getComputedModeForLinkTag(tagName: string): LinkTagMode {
    const tag: DidactedLinkTag|undefined = findLinkTagByName(tagName)
    if (!tag) {
        util.logWarning('cannot getComputedModeForLinkTag because no LinkTag with name '+tagName+' found, returning visible as default')
        return 'visible'
    }
    return tag.getMode()
}

function findLinkTagByName(tagName: string): DidactedLinkTag|undefined {
    return getLinkTags().find(tag => tag.getName() === tagName)
}

export function getLinkTags(): DidactedLinkTag[] {
    return pluginFacade.getMap().getProjectSettings().getLinkTags().map(tagData => new DidactedLinkTag(tagData))
}
