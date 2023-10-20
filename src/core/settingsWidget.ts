import { PopupWidget } from './PopupWidget'
import { renderManager } from './RenderManager'
import { BooleanSetting, settings } from './Settings'
import { BooleanSettingWidget } from './settings/BooleanSettingWidget'

export async function openIfNotOpened(): Promise<void> {
  if (!settingsWidget) {
    settingsWidget = new SettingsWidget()
    await settingsWidget.render()
  }
}

let settingsWidget: SettingsWidget|undefined

class SettingsWidget extends PopupWidget {
  private readonly zoomSpeedInputId: string
  private readonly boxMinSizeToRenderInputId: string
  private settingWidgets: BooleanSettingWidget[]

  public constructor() {
    super('applicationSettingsWidget', 'ApplicationSettings')

    this.zoomSpeedInputId = this.getId()+'ZoomSpeed'
    this.boxMinSizeToRenderInputId = this.getId()+'BoxMinSizeToRender'
    this.settingWidgets = [
      this.buildBooleanSettingWidget('boxesDraggableIntoOtherBoxes'),
      this.buildBooleanSettingWidget('developerMode'),
      this.buildBooleanSettingWidget('experimentalFeatures'),
      this.buildBooleanSettingWidget('htmlApplicationMenu'),
      this.buildBooleanSettingWidget('sidebar'),
      this.buildBooleanSettingWidget('transparentBottomBar')
    ]
  }

  private buildBooleanSettingWidget(setting: BooleanSetting): BooleanSettingWidget {
    return new BooleanSettingWidget(`${this.id}-${setting}`, setting)
  }

  private getTableId(): string {
    return `${this.getId()}-table`
  }

  protected formContent(): string {
    let zoomSpeedHtml = '<td>'
    zoomSpeedHtml += `<label for="${this.zoomSpeedInputId}">zoomSpeed: </label>`
    zoomSpeedHtml += '</td><td>'
    zoomSpeedHtml += `<input id="${this.zoomSpeedInputId}"`
    zoomSpeedHtml += ` type="range" min="1" max="5" value="${settings.getZoomSpeed()}"`
    zoomSpeedHtml += ` oninput="this.nextElementSibling.value=this.value"`
    zoomSpeedHtml += `>`
    zoomSpeedHtml += `<output>${settings.getZoomSpeed()}</output>`
    zoomSpeedHtml += '</td>'

    let boxMinSizeToRenderHtml = '<td>'
    boxMinSizeToRenderHtml += `<label for="${this.boxMinSizeToRenderInputId}">boxMinSizeToRenderInPixel: </label>`
    boxMinSizeToRenderHtml += '</td><td>'
    boxMinSizeToRenderHtml += `<input id="${this.boxMinSizeToRenderInputId}"`
    boxMinSizeToRenderHtml += ` type="number" value="${settings.getBoxMinSizeToRender()}"`
    boxMinSizeToRenderHtml += `>`
    boxMinSizeToRenderHtml += '</td>'

    let html = `<table id="${this.getTableId()}">`
    html += `<tr>${zoomSpeedHtml}</tr>`
    html += `<tr>${boxMinSizeToRenderHtml}</tr>`
    html += '</table>'

    return html
  }

  protected override async afterRender(): Promise<void> {
    await Promise.all([
      renderManager.addChangeListenerTo<string>(
        this.zoomSpeedInputId, 'value',
        (value: string) => settings.setZoomSpeed(parseInt(value))
      ),
      renderManager.addChangeListenerTo<string>(
        this.boxMinSizeToRenderInputId, 'value',
        (value: string) => settings.setBoxMinSizeToRender(parseInt(value))
      ),
      renderManager.addElementsTo(this.getTableId(), this.settingWidgets.map(widget => widget.shape()))
    ])
  }

  protected override async beforeUnrender(): Promise<void> {
    settingsWidget = undefined
    await Promise.all([
      renderManager.removeEventListenerFrom(this.zoomSpeedInputId, 'change'),
      renderManager.removeEventListenerFrom(this.boxMinSizeToRenderInputId, 'change'),
    ])
  }

}
