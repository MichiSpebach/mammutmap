import { util } from '../util'
import { LinkAppearanceData } from './LinkAppearanceData'
import { TagData } from './TagData'

export class LinkTagData extends TagData {

    public readonly appearance: LinkAppearanceData
    
    public static readonly defaultTagNames: string[] = [
        'hidden',
        'isA', // TODO: add description "inheritance"
        'has', // TODO: add description "composition"
        'important', // TODO: add description "visible although other tag would hide it"
        'falsePositive', // TODO: add description "wrongly recognized by plugin"
    ]

    public static ofRawObject(object: any): TagData {
        const linkTagData: LinkTagData = Object.setPrototypeOf(object, LinkTagData.prototype)

        if (linkTagData.appearance) {
            Object.assign(linkTagData.appearance, LinkAppearanceData.ofRawObject(linkTagData.appearance)) // raw object would have no methods
        } else {
            Object.assign(linkTagData.appearance, new LinkAppearanceData())
        }

        linkTagData.validate()

        return linkTagData
    }

    public constructor(name: string, count: number, appearance?: LinkAppearanceData) {
        super(name, count)

        if (appearance) {
            this.appearance = appearance
        } else {
            this.appearance = new LinkAppearanceData()
        }

        this.validate()
    }

    private validate(): void {
        if (!this.name) {
            util.logWarning('LinkTagData::name is undefined or null.')
        }
        if (!this.count) {
            util.logWarning('LinkTagData::count is undefined or null.')
        }
        if (!this.appearance) {
            util.logWarning('LinkTagData::appearance is undefined or null.')
        }
    }

}