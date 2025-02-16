import { Style } from './RenderElement'

export function stylesToCssText(styles: {[key: string]: Style}): string {
	let cssText: string = ''
	for (const [styleRuleName, style] of Object.entries(styles)) {
		cssText += `.${styleRuleName}{`
		for (const [key, value] of Object.entries(style)) {
			cssText += `${key.replaceAll(/[A-Z]/g, match => '-'+match)}:${value};`
		}
		cssText += '}'
	}
	return cssText
}