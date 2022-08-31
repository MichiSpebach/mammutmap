import { PopupWidget } from './PopupWidget'
import { renderManager } from './RenderManager'
import { BooleanSetting, settings } from './Settings'

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
  private readonly boxesDraggableIntoOtherBoxesInputId: string
  private readonly developerModeInputId: string
  private readonly htmlApplicationMenuInputId: string

  public constructor() {
    super('applicationSettingsWidget', 'ApplicationSettings')

    this.zoomSpeedInputId = this.getId()+'ZoomSpeed'
    this.boxMinSizeToRenderInputId = this.getId()+'BoxMinSizeToRender'
    this.boxesDraggableIntoOtherBoxesInputId = this.getId()+'BoxesDraggableIntoOtherBoxes'
    this.developerModeInputId = this.getId()+'DeveloperMode'
    this.htmlApplicationMenuInputId = this.getId()+'HtmlApplicationMenu'
  }

  protected formContentHtml(): string {
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

    let html = '<table>'
    html += `<tr>${zoomSpeedHtml}</tr>`
    html += `<tr>${boxMinSizeToRenderHtml}</tr>`
    html += this.formCheckboxRowHtml(this.boxesDraggableIntoOtherBoxesInputId, 'boxesDraggableIntoOtherBoxes')
    html += this.formCheckboxRowHtml(this.developerModeInputId, 'developerMode')
    html += this.formCheckboxRowHtml(this.htmlApplicationMenuInputId, 'htmlApplicationMenu')
    html += '</table>'

    return html
  }

  private formCheckboxRowHtml(id: string, settingsName: BooleanSetting): string {
    let dataCellsHtml = '<td>'
    dataCellsHtml += `<label for="${id}">${settingsName}: </label>`
    dataCellsHtml += '</td><td>'
    dataCellsHtml += `<input id="${id}"`
    dataCellsHtml += ` type="checkbox" ${settings.getBoolean(settingsName) ? 'checked' : ''}`
    dataCellsHtml += `>`
    dataCellsHtml += '</td>'
    return `<tr>${dataCellsHtml}</tr>`
  }

  protected async afterRender(): Promise<void> {
    await Promise.all([
      renderManager.addChangeListenerTo<string>(
        this.zoomSpeedInputId, 'value',
        (value: string) => settings.setZoomSpeed(parseInt(value))
      ),
      renderManager.addChangeListenerTo<string>(
        this.boxMinSizeToRenderInputId, 'value',
        (value: string) => settings.setBoxMinSizeToRender(parseInt(value))
      ),
      this.addChangeListenerToCheckbox(this.boxesDraggableIntoOtherBoxesInputId, 'boxesDraggableIntoOtherBoxes'),
      this.addChangeListenerToCheckbox(this.developerModeInputId, 'developerMode'),
      this.addChangeListenerToCheckbox(this.htmlApplicationMenuInputId, 'htmlApplicationMenu')
    ])
  }

  private async addChangeListenerToCheckbox(id: string, settingsName: BooleanSetting): Promise<void> {
    await renderManager.addChangeListenerTo<boolean>(id, 'checked', (value: boolean) => settings.setBoolean(settingsName, value))
  }

  protected async beforeUnrender(): Promise<void> {
    settingsWidget = undefined
    await Promise.all([
      renderManager.removeEventListenerFrom(this.zoomSpeedInputId, 'change'),
      renderManager.removeEventListenerFrom(this.boxMinSizeToRenderInputId, 'change'),
      renderManager.removeEventListenerFrom(this.boxesDraggableIntoOtherBoxesInputId, 'change'),
      renderManager.removeEventListenerFrom(this.developerModeInputId, 'change'),
      renderManager.removeEventListenerFrom(this.htmlApplicationMenuInputId, 'change')
    ])
  }

}
