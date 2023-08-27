import { fileSystem } from './fileSystemAdapter'
import { LinkTagData } from './mapData/LinkTagData'
import { MapSettingsData } from './mapData/MapSettingsData'
import { Subscribers } from './util/Subscribers'
import { util } from './util/util'
import { LinkAppearanceData } from './mapData/LinkAppearanceData'
import { log } from './logService'
import { settings } from './Settings'

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
      x: 0, y: 0, width: 100, height: 100,
      links: [],
      nodes: [],
      srcRootPath: '../',
      mapRootPath: './',
      linkTags: []
    })
    if (settings.getBoolean('positionMapOnTopLeft')) {
      // TODO: backwards compatibility for e2e tests, remove asap
      data.x = 5
      data.y = 5
      data.width = 90
      data.height = 90
    }
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
    await fileSystem.saveToJsonFile(this.projectSettingsFilePath, this.data, {throwInsteadOfWarn: true}).then(() => {
      log.info('saved ProjectSettings into '+this.projectSettingsFilePath)
      if (!this.dataFileExists) {
        this.addMapFolderToGitignore()
      }
      this.dataFileExists = true
    }).catch(reason => {
      log.warning(`ProjectSettings::saveToFileSystem() failed at projectSettingsFilePath "${this.projectSettingsFilePath}", reason is ${reason}`)
    })
  }

  public isDataFileExisting(): boolean {
    return this.dataFileExists
  }

  public async addMapFolderToGitignore(): Promise<void> {
    const mapFolderPath: string = this.getAbsoluteMapRootPath()
    const mapFolderName: string|undefined = util.getElementsOfPath(mapFolderPath).pop()
    if (!mapFolderName) {
      log.warning(`ProjectSettings::addMapFolderToGitignore() mapFolderPath '${mapFolderPath}' seems to be empty.`)
      return
    }
    const gitignorePath: string = util.removeLastElementFromPath(mapFolderPath)+'.gitignore'
    if (await fileSystem.doesDirentExistAndIsFile(gitignorePath)) {
      let gitignoreContent: string = await fileSystem.readFile(gitignorePath)
      gitignoreContent = `# Mammutmap, feel free to remove this line to share the map via Git\n${mapFolderName}/\n\n${gitignoreContent}`
      await fileSystem.writeFile(gitignorePath, gitignoreContent)
      log.info(`ProjectSettings::addMapFolderToGitignore() added '${mapFolderName}/' to '${gitignorePath}', feel free to remove this line from .gitignore to share the map via Git.`)
    }
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

  public getRawField(name: string): unknown {
    return this.data.getRawField(name)
  }

  public async setRawField(name: string, value: any): Promise<void> {
    this.data.setRawField(name, value)
    await this.saveToFileSystem()
  }

}
