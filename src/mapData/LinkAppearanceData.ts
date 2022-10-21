import { style } from '../styleAdapter'
import { JsonObject } from '../JsonObject'
import { util } from '../util'

export const linkAppearanceModes = ['notRendered', 'visibleEnds', 'visible'] as const // "as const" makes LinkTagMode a typesafe union of literals
export type LinkAppearanceMode = typeof linkAppearanceModes[number]

export class LinkAppearanceData extends JsonObject {

    public constructor(
        private mode?: LinkAppearanceMode,
        private color?: string
    ) {
        super()
        this.validate()
    }

    private validate() {
        if (this.mode && !linkAppearanceModes.includes(this.mode)) {
            util.logWarning('mode '+this.mode+' is not known')
        }
    }

    public getMode(): LinkAppearanceMode {
        if (!this.mode) {
            return 'visible'
        }
        return this.mode
    }

    public setMode(mode: LinkAppearanceMode): void {
        if (mode === 'visible') {
            this.mode = undefined
        } else {
            this.mode = mode
        }
    }

    public getColor(): string {
        if (!this.color) {
            return style.getLinkColor()
        }
        return this.color
    }

    public setColor(color: string): void {
        if (color === style.getLinkColor()) {
            this.color = undefined
        } else {
            this.color = color
        }
    }

}