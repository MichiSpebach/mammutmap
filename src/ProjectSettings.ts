import { fileSystem } from './fileSystemAdapter'
import { JsonObject } from './JsonObject'
import { util } from './util'

export class ProjectSettings extends JsonObject { // TODO: rename to MapSettings?

  public static readonly preferredFileNameExtension = 'mapsettings.json'
  public static readonly preferredFileName = 'maproot.'+ProjectSettings.preferredFileNameExtension
  public static readonly alternativeFileNameExtension = 'json'
  public static readonly alternativeFileNames = ['mapRoot.'+ProjectSettings.alternativeFileNameExtension]

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
  }

  public async saveToFileSystem(): Promise<void> {
    await fileSystem.saveToJsonFile(this.projectSettingsFilePath, this)
    util.logInfo('saved ProjectSettings into '+this.projectSettingsFilePath)
  }

  public toJson(): string {
    return util.toFormattedJson({srcRootPath: this.srcRootPath, mapRootPath: this.mapRootPath})
  }

  public mergeIntoJson(jsonToMergeInto: string): string {
    // TODO: improve, jsonToMergeInto should only be changed where needed (not completely reformatted)
    const objectToMergeInto: Object = JSON.parse(jsonToMergeInto)
    const mergedObject: Object = {...objectToMergeInto, ...{srcRootPath: this.srcRootPath, mapRootPath: this.mapRootPath}}
    const mergedJson: string = util.toFormattedJson(mergedObject)
    return mergedJson
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
