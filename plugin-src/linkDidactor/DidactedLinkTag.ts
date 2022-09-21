import { LinkTagData } from '../../dist/mapData/LinkTagData'
import { util } from '../../dist/util'

const linkTagModes = ['notDisplayed', 'visibleEnds', 'visible'] as const // "as const" makes LinkTagMode a typesafe union of literals
export type LinkTagMode = typeof linkTagModes[number]

export class DidactedLinkTag  {

    private data: LinkTagData & {mode?: LinkTagMode}

    public constructor(data: LinkTagData & {mode?: LinkTagMode}) {
        this.data = data
        this.validateMode()
    }

    private validateMode() {
        const mode: LinkTagMode = (this.data as any).mode
        if (mode && !(mode in linkTagModes)) {
            util.logWarning('mode '+mode+' is not known')
        }
    }

    public getName(): string {
        return this.data.name
    }

    public getMode(): LinkTagMode {
        if (!this.data.mode) {
            return 'visible'
        }
        return this.data.mode
    }

    public setMode(mode: LinkTagMode): void {
        if (mode === 'visible') {
            this.data.mode = undefined
        } else {
            this.data.mode = mode
        }
    }
}