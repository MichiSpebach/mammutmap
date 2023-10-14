import { UltimateWidget, Widget } from '../Widget'

export interface ToolbarView {
  getName(): string
  getWidget(): UltimateWidget
}
