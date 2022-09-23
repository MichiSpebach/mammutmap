import { fileSystem } from './fileSystemAdapter'
import { LinkTagData } from './mapData/LinkTagData'
import { MapSettingsData } from './mapData/MapSettingsData'
import { Subscribers } from './Subscribers'
import { util } from './util'

export class ProjectSettings { // TODO: rename to MapSettings?

  public static readonly preferredFileNameExtension = 'mapsettings.json'
  public static readonly preferredFileName = 'maproot.'+ProjectSettings.preferredFileNameExtension
  public static readonly alternativeFileNameExtension = 'json'
  public static readonly alternativeFileNames = ['mapRoot.'+ProjectSettings.alternativeFileNameExtension]

  private projectSettingsFilePath: string
  private absoluteSrcRootPath: string
  private absoluteMapRootPath: string

  public readonly linkTagSubscribers: Subscribers<LinkTagData[]> = new Subscribers()

  private data: MapSettingsData

  public static isProjectSettingsFileName(fileName: string): boolean {
    return fileName === this.preferredFileName || this.alternativeFileNames.includes(fileName)
  }

  public static async loadFromFileSystem(filePath: string): Promise<ProjectSettings> {
    const settingsJson: string = await fileSystem.readFile(filePath) // TODO: implement and use fileSystem.readJsonFile(path: string): Object|any
    const settingsParsed: any = JSON.parse(settingsJson)
    const data: MapSettingsData = MapSettingsData.ofRawObject(settingsParsed)
    return new ProjectSettings(filePath, data)
  }

  public static newWithDefaultData(filePath: string): ProjectSettings {
    return new ProjectSettings(filePath, new MapSettingsData('../', './'))
  }

  private constructor(projectSettingsFilePath: string, data: MapSettingsData) {
    this.projectSettingsFilePath = projectSettingsFilePath

    const projectSettingsFolderPath: string = util.removeLastElementFromPath(projectSettingsFilePath)
    this.absoluteSrcRootPath = util.joinPaths([projectSettingsFolderPath, data.srcRootPath])
    this.absoluteMapRootPath = util.joinPaths([projectSettingsFolderPath, data.mapRootPath])

    this.data = data
  }

  public async saveToFileSystem(): Promise<void> {
    await fileSystem.saveToJsonFile(this.projectSettingsFilePath, this.data)
    util.logInfo('saved ProjectSettings into '+this.projectSettingsFilePath)
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
    return this.data.srcRootPath
  }

  public getMapRootPath(): string {
    return this.data.mapRootPath
  }

  public getLinkTags(): LinkTagData[] {
    return this.data.linkTags
  }

  public getLinkTagNamesWithDefaults(): string[] {
    return this.data.getLinkTagNamesWithDefaults()
  }

  public async countUpLinkTagAndSave(tagName: string): Promise<void> {
    this.data.countUpLinkTag(tagName)
    this.linkTagSubscribers.call(this.getLinkTags())
    await this.saveToFileSystem()
  }

  public async countDownLinkTagAndSave(tagName: string): Promise<void> {
    this.data.countDownLinkTag(tagName)
    this.linkTagSubscribers.call(this.getLinkTags())
    await this.saveToFileSystem()
  }

}
