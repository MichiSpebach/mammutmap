import { Box } from '../../../../src/core/box/Box'
import { Link } from '../../../../src/core/link/Link'
import { LinkData } from '../../../../src/core/mapData/LinkData'
import { LinkEndData } from '../../../../src/core/mapData/LinkEndData'

export function of(id: string, managingBox: Box): Link {
    return Link.new(new LinkData(id, new LinkEndData([]), new LinkEndData([])), managingBox)
}