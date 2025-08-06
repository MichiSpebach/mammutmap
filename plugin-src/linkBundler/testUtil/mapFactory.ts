import { ProjectSettings } from '../../../dist/core/ProjectSettings'
import { Map } from '../../../dist/core/Map'
import * as projectSettingsFactory from './projectSettingsFactory'
import * as mapSettingsDataFactory from './mapSettingsDataFactory'
import { ClientRect } from '../../../dist/core/ClientRect'
import { renderManager } from '../../../dist/core/renderEngine/renderManager'
import * as boxFactory from './boxFactory'
import { Style } from '../../../dist/core/renderEngine/RenderElement'

export function mapOf(options: {
	projectSettings?: ProjectSettings,
	overrideRenderManager: {getClientRectOf: {map: ClientRect, mapRatioAdjuster: ClientRect}},
	rootFolder: {
		rendered: boolean,
		bodyRendered: boolean,
		clientRect?: ClientRect
	}
}): Map {
	const map = new Map('content', options.projectSettings?? projectSettingsFactory.of({data: mapSettingsDataFactory.of({id: 'root'})}))
	
	const mapRatioAdjusterRect: ClientRect = options.overrideRenderManager.getClientRectOf.mapRatioAdjuster
	const rootFolderRect: ClientRect = options.rootFolder.clientRect?? mapRatioAdjusterRect
	let rootFolderStyle: Style =  {
		left: `${((rootFolderRect.x-mapRatioAdjusterRect.x)/mapRatioAdjusterRect.width)*100}%`,
		top: `${((rootFolderRect.y-mapRatioAdjusterRect.y)/mapRatioAdjusterRect.height)*100}%`,
		width: `${(rootFolderRect.width/mapRatioAdjusterRect.width)*100}%`,
		height: `${(rootFolderRect.height/mapRatioAdjusterRect.height)*100}%`
	}
	const renderManagerBackup = {
		getClientRectOf: renderManager.getClientRectOf,
		setStyleTo: renderManager.setStyleTo
	}
	renderManager.getClientRectOf = async (id, ...args) => {
		for (const idWithValueToOverride of Object.entries(options.overrideRenderManager.getClientRectOf)) {
			if (id === idWithValueToOverride[0]) {
				return Promise.resolve(idWithValueToOverride[1])
			}
		}
		if (id === map.getRootFolder().getId()) {
			const measuresInPercent: {left?: number, top?: number, width?: number, height?: number} = {}
			for (const key of ['left', 'top', 'width', 'height'] as const) {
				const value: string|null|undefined = rootFolderStyle[key]
				if (value?.endsWith('%')) {
					measuresInPercent[key] = Number(value.slice(0, -1))
				} else {
					console.warn(`mapFactory renderManager.getClientRectOf rootFolderStyle.${key}='${rootFolderStyle[key]}' does not end with '%'`)
				}
			}
			if (measuresInPercent.left && measuresInPercent.top && measuresInPercent.width && measuresInPercent.height) {
				return new ClientRect(
					mapRatioAdjusterRect.x + (measuresInPercent.left/100)*mapRatioAdjusterRect.width,
					mapRatioAdjusterRect.y + (measuresInPercent.top/100)*mapRatioAdjusterRect.height,
					(measuresInPercent.width/100)*mapRatioAdjusterRect.width,
					(measuresInPercent.height/100)*mapRatioAdjusterRect.height
				)
			}
			console.warn(`mapFactory renderManager.getClientRectOf !measuresInPercent.left || !measuresInPercent.top || !measuresInPercent.width || !measuresInPercent.height`)
			return mapRatioAdjusterRect
		}
		return renderManagerBackup.getClientRectOf(id, ...args)
	}
	renderManager.setStyleTo = async (id, style, ...args) => {
		if (id === map.getRootFolder().getId()) {
			if (typeof style === 'string') {
				rootFolderStyle = {}
				for (const attribute of style.split(';')) {
					if (attribute.length > 0) {
						const attributeParts: string[] = attribute.split(':')
						if (attributeParts.length !== 2) {
							console.warn(`mapFactory renderManager.setStyleTo attributeKeyWithValue.length !== 2, attributeKeyWithValue='${attributeParts}'`)
						}
						rootFolderStyle[attributeParts[0]] = attributeParts[1]
					}
				}
			} else {
				rootFolderStyle = style
			}
		} else {
			return renderManagerBackup.setStyleTo(id, style, ...args)
		}
	}

	const rootFolder = map.getRootFolder()
	rootFolder.saveMapData = () => Promise.resolve()
	boxFactory.setRenderStateToBox(rootFolder, options.rootFolder.rendered)
	boxFactory.setRenderStateToBoxBody(rootFolder.body, options.rootFolder.bodyRendered)

	return map
}