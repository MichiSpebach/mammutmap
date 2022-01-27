import { fileSystem } from './fileSystemAdapter'
import { util } from './util'

export class ProjectSettings { // TODO: rename to MapSettings?

  public static readonly fileName = 'mapRoot.json' // TODO: find a more unique name

  private projectSettingsFilePath: string
  private absoluteSrcRootPath: string
  private absoluteMapRootPath: string

  private srcRootPath: string
  private mapRootPath: string

  public static async loadFromFileSystem(filePath: string): Promise<ProjectSettings> {
    const settingsJson: string = await fileSystem.readFile(filePath) // TODO: implement and use fileSystem.readJsonFile(path: string): Object|any
    const settingsParsed: any = JSON.parse(settingsJson)
    return new ProjectSettings(filePath, settingsParsed['srcRootPath'], settingsParsed['mapRootPath'])
  }

  public constructor(projectSettingsFilePath: string, srcRootPath: string, mapRootPath: string) {
    this.projectSettingsFilePath = projectSettingsFilePath
    const projectSettingsFolderPath: string = util.removeLastElementFromPath(projectSettingsFilePath)
    this.absoluteSrcRootPath = util.joinPaths([projectSettingsFolderPath, srcRootPath])
    this.absoluteMapRootPath = util.joinPaths([projectSettingsFolderPath, mapRootPath])
    this.srcRootPath = srcRootPath
    this.mapRootPath = mapRootPath
  }

  public async saveToFileSystem(): Promise<void> {
    await fileSystem.saveObject(this.projectSettingsFilePath, {srcRootPath: this.srcRootPath, mapRootPath: this.mapRootPath})
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
    return this.srcRootPath
  }

  public getMapRootPath(): string {
    return this.mapRootPath
  }

}
