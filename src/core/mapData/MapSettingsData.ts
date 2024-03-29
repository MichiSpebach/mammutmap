import { util } from '../util/util'
import { BoxData } from './BoxData'
import { LinkAppearanceData } from './LinkAppearanceData'
import { LinkData } from './LinkData'
import { LinkTagData } from './LinkTagData'
import { NodeData } from './NodeData'

export class MapSettingsData extends BoxData {
    public srcRootPath: string
    public mapRootPath: string
    public linkTags: LinkTagData[] // TODO: move into data of boxes for tree structure?
    public readonly defaultLinkAppearance: LinkAppearanceData

    public static override ofRawObject(object: any): MapSettingsData {
        const boxData: BoxData = BoxData.ofRawObject(object)
        const mapSettingsData: MapSettingsData = Object.setPrototypeOf(boxData, MapSettingsData.prototype)

        mapSettingsData.linkTags = object.linkTags? object.linkTags.map((rawTag: any) => LinkTagData.ofRawObject(rawTag)) : []

        if (mapSettingsData.defaultLinkAppearance) {
            (mapSettingsData.defaultLinkAppearance as LinkAppearanceData) = LinkAppearanceData.ofRawObject(mapSettingsData.defaultLinkAppearance)
        } else {
            (mapSettingsData.defaultLinkAppearance as LinkAppearanceData) = new LinkAppearanceData()
        }

        mapSettingsData.validateMapSettingsData()
        
        return mapSettingsData
    }

    public constructor(options: {
        id: string,
        x: number, y: number, width: number, height: number,
        links: LinkData[],
        nodes: NodeData[],
        srcRootPath: string,
        mapRootPath: string,
        linkTags: LinkTagData[],
        defaultLinkAppearance?: LinkAppearanceData
    }) {
        super(options.id, options.x, options.y, options.width, options.height, options.links, options.nodes)
        this.srcRootPath = options.srcRootPath
        this.mapRootPath = options.mapRootPath
        this.linkTags = options.linkTags
        
        if (options.defaultLinkAppearance) {
            this.defaultLinkAppearance = options.defaultLinkAppearance
        } else {
            this.defaultLinkAppearance = new LinkAppearanceData()
        }

        this.validateMapSettingsData()
    }

    private validateMapSettingsData(): void { // super.validate() is not overriden because it is also called in constructor of super class
        super.validate()

        if (!this.srcRootPath || !this.mapRootPath) { // can happen when called with type any
            let message = 'MapSettingsData need to have a srcRootPath and a mapRootPath'
            message += ', but specified srcRootPath is '+this.srcRootPath+' and mapRootPath is '+this.mapRootPath+'.'
            util.logWarning(message)
        }

        if (!this.linkTags) {
            util.logWarning('MapSettingsData::linkTags are undefined or null.')
        }
        
        if (!this.defaultLinkAppearance) {
            util.logWarning('MapSettingsData::defaultLinkAppearance is undefined or null.')
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