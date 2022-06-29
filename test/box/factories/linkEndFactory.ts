import { Box } from '../../../src/box/Box'
import { Link } from '../../../src/box/Link'
import { LinkEnd } from '../../../src/box/LinkEnd'
import { LinkEndData } from '../../../src/box/LinkEndData'
import * as linkFactory from './linkFactory'

export function renderedOf(linkEndData: LinkEndData, managingBox: Box, boxesRegisteredAt: Box[]): LinkEnd {
    const {linkEnd, referenceLink} = of(linkEndData, managingBox)

    const linkEndModifiable = linkEnd as any
    linkEndModifiable.boxesRegisteredAt = boxesRegisteredAt
    linkEndModifiable.borderingBox = boxesRegisteredAt.length > 0 ? boxesRegisteredAt[boxesRegisteredAt.length-1] : managingBox

    boxesRegisteredAt.forEach(box => box.borderingLinks.register(referenceLink))

    return linkEnd
}

export function of(linkEndData: LinkEndData, managingBox: Box): {linkEnd: LinkEnd, referenceLink: Link} {
    // TODO: implement this a little bit more deeply to be usable for more cases
    const referenceLink: Link = linkFactory.of('linkId', managingBox)

    const linkEnd = new LinkEnd('linkEndId', linkEndData, referenceLink, 'arrow')

    return {linkEnd, referenceLink}
}
