import * as util from './util'
import * as fileSystem from './fileSystemAdapter'

class Settings {

  private static readonly settingsFilePath: string = './settings.json'

  private zoomSpeed: number
  private boxMinSizeToRender: number

  public constructor() {
    const settingsJson: string = fileSystem.readFileSync(Settings.settingsFilePath)
    const settingsParsed: any = JSON.parse(settingsJson)

    this.zoomSpeed = settingsParsed['zoomSpeed']
    this.boxMinSizeToRender = settingsParsed['boxMinSizeToRender']
  }

  private async save(): Promise<void> {
    await fileSystem.writeFile(Settings.settingsFilePath, util.toFormattedJson(this))
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

}

export const settings = new Settings()
