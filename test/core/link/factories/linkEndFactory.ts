import { Box } from '../../../../src/core/box/Box'
import { Link } from '../../../../src/core/link/Link'
import { LinkEnd } from '../../../../src/core/link/LinkEnd'
import { LinkEndData } from '../../../../src/core/mapData/LinkEndData'
import * as linkFactory from './linkFactory'

export function of(linkEndData: LinkEndData, managingBox: Box): LinkEnd {
    // TODO: implement this a little bit more deeply to be usable for more cases
    const referenceLink: Link = linkFactory.of('linkId', managingBox)
    ;(managingBox.links as any).links.push(referenceLink)

    const linkEnd = new LinkEnd('linkEndId', linkEndData, referenceLink, 'arrow')

    return linkEnd
}
