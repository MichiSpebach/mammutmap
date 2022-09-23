import { TagData } from './TagData'

export class LinkTagData extends TagData {
    
    public static readonly defaultTagNames: string[] = [
        'hidden',
        'isA', // TODO: add description "inheritance"
        'has', // TODO: add description "composition"
        'important', // TODO: add description "visible although other tag would hide it"
        'falsePositive', // TODO: add description "wrongly recognized by plugin"
    ]

    public static ofRawObject(object: any): TagData {
        const linkTagData: LinkTagData = Object.setPrototypeOf(object, LinkTagData.prototype)
        // TODO: implement validate like in BoxMapData to warn when loaded data is corrupted
        return linkTagData
    }

}