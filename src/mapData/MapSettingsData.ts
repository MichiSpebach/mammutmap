import { util } from '../util'
import { JsonObject } from './../JsonObject'
import { LinkTagData } from './LinkTagData'

export class MapSettingsData extends JsonObject {
    public srcRootPath: string
    public mapRootPath: string
    public linkTags: LinkTagData[] // TODO: move into data of boxes for tree structure?

    public static ofRawObject(object: any): MapSettingsData {
        const mapDataSettings: MapSettingsData = Object.setPrototypeOf(object, MapSettingsData.prototype)
        mapDataSettings.linkTags = object.linkTags? object.linkTags.map((rawTag: any) => LinkTagData.ofRawObject(rawTag)) : []
        mapDataSettings.validate()
        return mapDataSettings
    }

    public constructor(srcRootPath: string, mapRootPath: string, linkTags: LinkTagData[] = []) {
        super()
        this.srcRootPath = srcRootPath
        this.mapRootPath = mapRootPath
        this.linkTags = linkTags

        this.validate()
    }

    private validate(): void {
        if (!this.srcRootPath || !this.mapRootPath) { // can happen when called with type any
            let message = 'MapSettingsData need to have a srcRootPath and a mapRootPath'
            message += ', but specified srcRootPath is '+this.srcRootPath+' and mapRootPath is '+this.mapRootPath+'.'
            util.logWarning(message)
        }
        if (!this.linkTags) {
            util.logWarning('MapSettingsData::linkTags are undefined or null.')
        }
    }

    public getLinkTagNamesWithDefaults(): string[] {
        let tagNames: string[] = this.linkTags.map(tag => tag.name)
        
        for (const defaultTagName of LinkTagData.defaultTagNames) {
          if (!tagNames.includes(defaultTagName)) {
            tagNames.push(defaultTagName)
          }
        }
    
        return tagNames
    }
    
    public countUpLinkTag(tagName: string): void {
        let tag: LinkTagData|undefined = this.linkTags.find(tag => tag.name === tagName)
    
        if (!tag) {
          tag = new LinkTagData(tagName, 1)
          this.linkTags.push(tag)
        } else {
          tag.count += 1
        }
    }
    
    public countDownLinkTag(tagName: string): void {
        let tag: LinkTagData|undefined = this.linkTags.find(tag => tag.name === tagName)

        if (!tag) {
            util.logWarning(`cannot count down tag ${tagName} because it is not known`)
            return
        }
        
        if (tag.count <= 1) {
            this.linkTags.splice(this.linkTags.indexOf(tag), 1)
        } else {
            tag.count -= 1
        }
    }

}