import { PopupWidget } from './PopupWidget'
import { renderManager } from './RenderManager'
import { settings } from './Settings'

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

  public constructor() {
    super('applicationSettingsWidget', 'ApplicationSettings')

    this.zoomSpeedInputId = this.getId()+'ZoomSpeed'
    this.boxMinSizeToRenderInputId = this.getId()+'BoxMinSizeToRender'
    this.boxesDraggableIntoOtherBoxesInputId = this.getId()+'BoxesDraggableIntoOtherBoxes'
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

    let boxesDraggableIntoOtherBoxesHtml = '<td>'
    boxesDraggableIntoOtherBoxesHtml += `<label for="${this.boxesDraggableIntoOtherBoxesInputId}">boxesDraggableIntoOtherBoxes: </label>`
    boxesDraggableIntoOtherBoxesHtml += '</td><td>'
    boxesDraggableIntoOtherBoxesHtml += `<input id="${this.boxesDraggableIntoOtherBoxesInputId}"`
    boxesDraggableIntoOtherBoxesHtml += ` type="checkbox" ${settings.getBoxesDraggableIntoOtherBoxes() ? 'checked' : ''}`
    boxesDraggableIntoOtherBoxesHtml += `>`
    boxesDraggableIntoOtherBoxesHtml += '</td>'

    let html = '<table>'
    html += `<tr>${zoomSpeedHtml}</tr>`
    html += `<tr>${boxMinSizeToRenderHtml}</tr>`
    html += `<tr>${boxesDraggableIntoOtherBoxesHtml}</tr>`
    html += '</table>'

    return html
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
      renderManager.addChangeListenerTo<boolean>(
        this.boxesDraggableIntoOtherBoxesInputId, 'checked',
        (value: boolean) => settings.setBoxesDraggableIntoOtherBoxes(value)
      )
    ])
  }

  protected async beforeUnrender(): Promise<void> {
    settingsWidget = undefined
    await Promise.all([
      renderManager.removeEventListenerFrom(this.zoomSpeedInputId, 'change'),
      renderManager.removeEventListenerFrom(this.boxMinSizeToRenderInputId, 'change'),
      renderManager.removeEventListenerFrom(this.boxesDraggableIntoOtherBoxesInputId, 'change')
    ])
  }

}
