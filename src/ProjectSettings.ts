import { fileSystem } from './fileSystemAdapter'
import { JsonObject } from './JsonObject'
import { LinkTagData } from './mapData/LinkTagData'
import { Subscribers } from './Subscribers'
import { util } from './util'

export class ProjectSettings extends JsonObject { // TODO: rename to MapSettings?

  public static readonly preferredFileNameExtension = 'mapsettings.json'
  public static readonly preferredFileName = 'maproot.'+ProjectSettings.preferredFileNameExtension
  public static readonly alternativeFileNameExtension = 'json'
  public static readonly alternativeFileNames = ['mapRoot.'+ProjectSettings.alternativeFileNameExtension]

  private projectSettingsFilePath: string
  private absoluteSrcRootPath: string
  private absoluteMapRootPath: string

  public readonly linkTagSubscribers: Subscribers<LinkTagData[]> = new Subscribers()

  private srcRootPath: string
  private mapRootPath: string
  private linkTags: LinkTagData[] // TODO: move into data of boxes for tree structure?

  public static isProjectSettingsFileName(fileName: string): boolean {
    return fileName === this.preferredFileName || this.alternativeFileNames.includes(fileName)
  }

  public static async loadFromFileSystem(filePath: string): Promise<ProjectSettings> {
    const settingsJson: string = await fileSystem.readFile(filePath) // TODO: implement and use fileSystem.readJsonFile(path: string): Object|any
    const settingsParsed: any = JSON.parse(settingsJson)
    const linkTags: LinkTagData[]|undefined = settingsParsed.linkTags?.map((rawTag: any) => LinkTagData.ofRawObject(rawTag))
    return new ProjectSettings(filePath, settingsParsed['srcRootPath'], settingsParsed['mapRootPath'], linkTags)
  }

  public constructor(projectSettingsFilePath: string, srcRootPath: string, mapRootPath: string, linkTags: LinkTagData[] = []) {
    if (!srcRootPath || !mapRootPath) { // can happen when called with type any
      let errorMessage = 'ProjectSettings need to have a srcRootPath and a mapRootPath'
      errorMessage += ', but specified srcRootPath is '+srcRootPath+' and mapRootPath is '+mapRootPath+'.'
      throw new Error(errorMessage)
    }

    super()
    this.projectSettingsFilePath = projectSettingsFilePath
    const projectSettingsFolderPath: string = util.removeLastElementFromPath(projectSettingsFilePath)
    this.absoluteSrcRootPath = util.joinPaths([projectSettingsFolderPath, srcRootPath])
    this.absoluteMapRootPath = util.joinPaths([projectSettingsFolderPath, mapRootPath])
    this.srcRootPath = srcRootPath
    this.mapRootPath = mapRootPath
    this.linkTags = linkTags
  }

  public async saveToFileSystem(): Promise<void> {
    await fileSystem.saveToJsonFile(this.projectSettingsFilePath, this)
    util.logInfo('saved ProjectSettings into '+this.projectSettingsFilePath)
  }

  public toJson(): string {
    return util.toFormattedJson(this.copyWithoutVolatileFields())
  }

  public mergeIntoJson(jsonToMergeInto: string): string {
    // TODO: improve, jsonToMergeInto should only be changed where needed (not completely reformatted)
    const objectToMergeInto: Object = JSON.parse(jsonToMergeInto)
    const mergedObject: Object = {...objectToMergeInto, ...this.copyWithoutVolatileFields()}
    const mergedJson: string = util.toFormattedJson(mergedObject)
    return mergedJson
  }

  private copyWithoutVolatileFields(): ProjectSettings {
    let thisWithoutVolatileFields: any = {...this}

    thisWithoutVolatileFields.projectSettingsFilePath = undefined // TODO: extract ProjectSettingsData class for fields that are saved
    thisWithoutVolatileFields.absoluteSrcRootPath = undefined
    thisWithoutVolatileFields.absoluteMapRootPath = undefined
    thisWithoutVolatileFields.linkTagSubscribers = undefined

    return thisWithoutVolatileFields
  }

  public getProjectSettingsFilePath(): string {
    return this.projectSettingsFilePath
  }

  public getAbsoluteSrcRootPath(): string {
    return this.absoluteSrcRootPath
  }

  public getAbsoluteMapRootPath(): string {
    return this.absoluteMapRootPath
  }

  public getSrcRootPath(): string {
    return this.srcRootPath
  }

  public getMapRootPath(): string {
    return this.mapRootPath
  }

  public getLinkTags(): LinkTagData[] {
    return this.linkTags
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

  public async countUpLinkTagAndSave(tagName: string): Promise<void> {
    let tag: LinkTagData|undefined = this.linkTags.find(tag => tag.name === tagName)

    if (!tag) {
      tag = new LinkTagData(tagName, 1)
      this.linkTags.push(tag)
    } else {
      tag.count += 1
    }

    this.linkTagSubscribers.call(this.getLinkTags())
    await this.saveToFileSystem()
  }

  public async countDownLinkTagAndSave(tagName: string): Promise<void> {
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

    this.linkTagSubscribers.call(this.getLinkTags())
    await this.saveToFileSystem()
  }

}
