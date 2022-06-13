import { util } from './util'
import { fileSystem } from './fileSystemAdapter'

class Settings {

  private static readonly settingsFileName: string = 'settings.json'
  private static readonly settingsFilePath: string = './'+Settings.settingsFileName
  private static readonly alternativeSettingsFilePath: string = 'resources/app/'+Settings.settingsFileName

  private zoomSpeed: number
  private boxMinSizeToRender: number
  private boxesDraggableIntoOtherBoxes: boolean
  private developerMode: boolean

  public static async loadFromFileSystem(): Promise<Settings> {
    let settingsJson: string
    if (await fileSystem.doesDirentExistAndIsFile(Settings.settingsFilePath)) {
      settingsJson = await fileSystem.readFile(Settings.settingsFilePath)
    } else { // happens when deployed application is started for the first time
      let message = Settings.settingsFilePath+' not found'
      message += ', loading application settings from '+Settings.alternativeSettingsFilePath+'.'
      util.logInfo(message)
      settingsJson = await fileSystem.readFile(Settings.alternativeSettingsFilePath).catch((reason) => {
        util.logError('Failed to load application settings because: '+reason)
      })
    }

    return new Settings(settingsJson)
  }

  private constructor(settingsJson: string) {
    const settingsParsed: any = JSON.parse(settingsJson)

    this.zoomSpeed = settingsParsed['zoomSpeed']
    this.boxMinSizeToRender = settingsParsed['boxMinSizeToRender']
    this.boxesDraggableIntoOtherBoxes = settingsParsed['boxesDraggableIntoOtherBoxes']
    this.developerMode = settingsParsed['developerMode']
  }

  private async save(): Promise<void> {
    await fileSystem.writeFile(Settings.settingsFilePath, util.toFormattedJson(this)) // TODO: merge into existing settings file (not replacing whole file)
      .then(() => {
        util.logInfo('saved ' + Settings.settingsFilePath)
      })
      .catch(error => util.logWarning('failed to save ' + Settings.settingsFilePath + ': ' + error))
  }

  public getZoomSpeed(): number {
    return this.zoomSpeed
  }

  public async setZoomSpeed(value: number): Promise<void> {
    this.zoomSpeed = value
    await this.save()
  }

  public getBoxMinSizeToRender(): number {
    return this.boxMinSizeToRender
  }

  public async setBoxMinSizeToRender(value: number) {
    this.boxMinSizeToRender = value
    await this.save()
  }

  public getBoolean(name: 'boxesDraggableIntoOtherBoxes'|'developerMode'): boolean {
    switch (name) {
      case 'boxesDraggableIntoOtherBoxes':
        return this.boxesDraggableIntoOtherBoxes
      case 'developerMode':
        return this.developerMode
      default:
        util.logWarning(`Cannot getBoolean setting with name ${name} and returning false, this happens most likely because of a plugin.`)
        return false
    }
  }

  public async setBoolean(name: 'boxesDraggableIntoOtherBoxes'|'developerMode', value: boolean): Promise<void> {
    switch (name) {
      case 'boxesDraggableIntoOtherBoxes':
        this.boxesDraggableIntoOtherBoxes = value
        break
      case 'developerMode':
        this.developerMode = value
        break
      default:
        util.logWarning(`Cannot setBoolean setting with name ${name}, this happens most likely because of a plugin.`)
        return
    }
    await this.save()
  }

}

export let settings: Settings

export const settingsOnStartup: Promise<Settings> = Settings.loadFromFileSystem() // TODO: use async module loading and get rid of this workaround

settingsOnStartup.then((loadedSettings: Settings) => {
  settings = loadedSettings
})
