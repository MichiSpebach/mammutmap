import { style } from '../styleAdapter'
import { JsonObject } from '../JsonObject'
import { util } from '../util'

// TODO: add 'hidden' to linkAppearanceModes
export const linkAppearanceModes = ['notRendered', 'visibleEnds', 'visible'] as const // "as const" makes LinkAppearanceMode a typesafe union of literals
export type LinkAppearanceMode = typeof linkAppearanceModes[number]

export class LinkAppearanceData extends JsonObject {

    public static ofRawObject(object: any): LinkAppearanceData {
        const data: LinkAppearanceData = Object.setPrototypeOf(object, LinkAppearanceData.prototype)
        data.validate()
        return data
    }

    public constructor(
        public mode?: LinkAppearanceMode,
        public color?: string
    ) {
        super()
        this.validate()
    }

    private validate() {
        if (this.mode && !linkAppearanceModes.includes(this.mode)) {
            util.logWarning('mode '+this.mode+' is not known')
        }
    }

}