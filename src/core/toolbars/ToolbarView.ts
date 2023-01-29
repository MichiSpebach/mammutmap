import { Widget } from '../Widget'

export interface ToolbarView {
  getName(): string
  getWidget(): Widget
}
