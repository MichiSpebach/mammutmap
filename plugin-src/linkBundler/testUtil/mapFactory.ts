import { ProjectSettings } from '../../../src/core/ProjectSettings'
import { Map } from '../../../src/core/Map'
import * as projectSettingsFactory from './projectSettingsFactory'
import * as mapSettingsDataFactory from './mapSettingsDataFactory'
import { ClientRect } from '../../../src/core/ClientRect'
import { renderManager } from '../../../src/core/renderEngine/renderManager'
import * as boxFactory from './boxFactory'
import { Style } from '../../../src/core/renderEngine/RenderElement'
import { MapSettingsData } from '../../../src/core/mapData/MapSettingsData'

export function mapOf(options: {
	projectSettings?: ProjectSettings,
	overrideRenderManager: {getClientRectOf: {map: ClientRect, mapRatioAdjuster: ClientRect}},
	rootFolder: {
		rendered: boolean,
		bodyRendered: boolean,
		clientRect?: ClientRect
	}
}): Map {
	const mapRatioAdjusterRect: ClientRect = options.overrideRenderManager.getClientRectOf.mapRatioAdjuster
	const rootFolderRect: ClientRect = options.rootFolder.clientRect?? mapRatioAdjusterRect
	const mapSettingsData: MapSettingsData = mapSettingsDataFactory.of({
		id: 'root',
		x: ((rootFolderRect.x-mapRatioAdjusterRect.x)/mapRatioAdjusterRect.width)*100,
		y: ((rootFolderRect.y-mapRatioAdjusterRect.y)/mapRatioAdjusterRect.height)*100,
		width: (rootFolderRect.width/mapRatioAdjusterRect.width)*100,
		height: (rootFolderRect.height/mapRatioAdjusterRect.height)*100
	})
	const map = new Map('content', options.projectSettings?? projectSettingsFactory.of({data: mapSettingsData}))
	
	let rootFolderStyle: Style =  {
		left: `${mapSettingsData.x}%`,
		top: `${mapSettingsData.y}%`,
		width: `${mapSettingsData.width}%`,
		height: `${mapSettingsData.height}%`
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