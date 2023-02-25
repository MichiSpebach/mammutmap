import { fileSystem } from './fileSystemAdapter'
import { LinkTagData } from './mapData/LinkTagData'
import { MapSettingsData } from './mapData/MapSettingsData'
import { Subscribers } from './util/Subscribers'
import { util } from './util/util'
import { LinkAppearanceData } from './mapData/LinkAppearanceData'

export class ProjectSettings { // TODO: rename to MapSettings?

  public static readonly preferredFileNameExtension = 'mapsettings.json'
  public static readonly preferredFileName = 'maproot.'+ProjectSettings.preferredFileNameExtension
  public static readonly alternativeFileNameExtension = 'json'
  public static readonly alternativeFileNames = ['mapRoot.'+ProjectSettings.alternativeFileNameExtension]

  public readonly linkTags: Subscribers<LinkTagData[]> = new Subscribers()
  
  private projectSettingsFilePath: string
  private absoluteSrcRootPath: string
  private absoluteMapRootPath: string

  public readonly data: MapSettingsData
  private dataFileExists: boolean

  public static isProjectSettingsFileName(fileName: string): boolean {
    return fileName === this.preferredFileName || this.alternativeFileNames.includes(fileName)
  }

  public static async loadFromFileSystem(filePath: string): Promise<ProjectSettings> {
    const settingsJson: string = await fileSystem.readFile(filePath) // TODO: implement and use fileSystem.readJsonFile(path: string): Object|any
    const settingsParsed: any = JSON.parse(settingsJson)
    const data: MapSettingsData = MapSettingsData.ofRawObject(settingsParsed)
    return new ProjectSettings(filePath, data, true)
  }

  public static newWithDefaultData(filePath: string): ProjectSettings {
    const data: MapSettingsData = new MapSettingsData({
      id: util.generateId(),
      x: 5, y: 5, width: 90, height: 90,
      links: [],
      nodes: [],
      srcRootPath: '../',
      mapRootPath: './',
      linkTags: []
    })
    return new ProjectSettings(filePath, data, false)
  }

  public constructor(projectSettingsFilePath: string, data: MapSettingsData, mapDataFileExists: boolean) {
    this.projectSettingsFilePath = projectSettingsFilePath

    const projectSettingsFolderPath: string = util.removeLastElementFromPath(projectSettingsFilePath)
    this.absoluteSrcRootPath = util.joinPaths([projectSettingsFolderPath, data.srcRootPath])
    this.absoluteMapRootPath = util.joinPaths([projectSettingsFolderPath, data.mapRootPath])

    this.data = data
    this.dataFileExists = mapDataFileExists
  }

  public async saveToFileSystem(): Promise<void> {
    await fileSystem.saveToJsonFile(this.projectSettingsFilePath, this.data)
    this.dataFileExists = true
    util.logInfo('saved ProjectSettings into '+this.projectSettingsFilePath)
  }

  public isDataFileExisting(): boolean {
    return this.dataFileExists
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
    this.linkTags.callSubscribers(this.getLinkTags())
    await this.saveToFileSystem()
  }

  public async countDownLinkTagAndSave(tagName: string): Promise<void> {
    this.data.countDownLinkTag(tagName)
    this.linkTags.callSubscribers(this.getLinkTags())
    await this.saveToFileSystem()
  }

  public getDefaultLinkAppearance(): LinkAppearanceData {
    return this.data.defaultLinkAppearance
  }

}
