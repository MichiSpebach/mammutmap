import * as util from './util'
import * as fileSystem from './fileSystemAdapter'

class Settings {

  private static readonly settingsFilePath: string = './settings.json'

  private zoomSpeed: number

  public constructor() {
    const settingsJson: string = fileSystem.readFileSync(Settings.settingsFilePath)
    const settingsParsed: any = JSON.parse(settingsJson)

    this.zoomSpeed = settingsParsed['zoomSpeed']
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

  public async setZoomSpeed(zoomSpeed: number): Promise<void> {
    this.zoomSpeed = zoomSpeed
    await this.save()
  }

}

export const settings = new Settings()
