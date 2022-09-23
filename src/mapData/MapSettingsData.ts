import { util } from '../util'
import { JsonObject } from './../JsonObject'
import { LinkTagData } from './LinkTagData'

export class MapSettingsData extends JsonObject {
    public srcRootPath: string
    public mapRootPath: string
    public linkTags: LinkTagData[] // TODO: move into data of boxes for tree structure?

    public static ofRawObject(object: any): MapSettingsData {
        const linkTags: LinkTagData[]|undefined = object.linkTags?.map((rawTag: any) => LinkTagData.ofRawObject(rawTag))
        return new MapSettingsData(object.srcRootPath, object.mapRootPath, linkTags) // raw object would have no methods // TODO: but maybe use setPrototype instead
    }

    public constructor(srcRootPath: string, mapRootPath: string, linkTags: LinkTagData[] = []) {
        if (!srcRootPath || !mapRootPath) { // can happen when called with type any
          let errorMessage = 'ProjectSettings need to have a srcRootPath and a mapRootPath'
          errorMessage += ', but specified srcRootPath is '+srcRootPath+' and mapRootPath is '+mapRootPath+'.'
          throw new Error(errorMessage)
        }
    
        super()
        this.srcRootPath = srcRootPath
        this.mapRootPath = mapRootPath
        this.linkTags = linkTags
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