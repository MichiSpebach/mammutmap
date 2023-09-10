import { BoxData } from '../../../../src/core/mapData/BoxData'
import { FolderBox } from '../../../../src/core/box/FolderBox'
import { RootFolderBox } from '../../../../src/core/box/RootFolderBox'
import { ClientRect } from '../../../../src/core/ClientRect'
import { ProjectSettings } from '../../../../src/core/ProjectSettings'
import { RenderState } from '../../../../src/core/util/RenderState'
import { Box } from '../../../../src/core/box/Box'
import * as mapSettingsDataFactory from '../../mapData/factories/mapSettingsDataFactory'
import * as projectSettingsFactory from '../../factories/projectSettingsFactory'
import { BoxContext } from '../../../../src/core/box/BoxContext'
import { FileBox } from '../../../../src/core/box/FileBox'
import { MapSettingsData } from '../../../../src/core/mapData/MapSettingsData'
import { BoxBody } from '../../../../src/core/box/BoxBody'

export function rootFolderOf(options: {
    idOrSettings: string|MapSettingsData|ProjectSettings, 
    rendered?: boolean,
    bodyRendered?: boolean
}): RootFolderBox {
    let projectSettings: ProjectSettings
    if (options.idOrSettings instanceof ProjectSettings) {
        projectSettings = options.idOrSettings
    } else if (options.idOrSettings instanceof MapSettingsData) {
        projectSettings = projectSettingsFactory.of({data: options.idOrSettings})
    } else {
        projectSettings = projectSettingsFactory.of({
            data: mapSettingsDataFactory.of({id: options.idOrSettings})
        })
    }
    const context: BoxContext = {
        projectSettings,
        getMapClientRect: () => Promise.resolve(new ClientRect(0, 0, 1600, 800))
    }

    const box = new RootFolderBox(context, 'idRenderedInto')
    box.getClientRect = () => Promise.resolve(new ClientRect(1600*0.2, 800*0.2, 1600*0.6, 800*0.6))
    box.saveMapData = () => Promise.resolve()
    setRenderStateToBox(box, options.rendered)
    setRenderStateToBoxBody(box.body, options.bodyRendered)

    return box
}

export function folderOf(options: {
    idOrData: string|BoxData, 
    name?: string,
    parent: FolderBox, 
    rendered?: boolean,
    bodyRendered?: boolean
}): FolderBox {
    let mapData: BoxData
    if (options.idOrData instanceof BoxData) {
        mapData = options.idOrData
    } else {
        mapData = new BoxData(options.idOrData, 20, 20, 60, 60, [], [])
    }
    const name = options.name ?? mapData.id+'Name'

    const box = new FolderBox(name, options.parent, mapData, false)
    box.saveMapData = () => Promise.resolve()
    setRenderStateToBox(box, options.rendered)
    setRenderStateToBoxBody(box.body, options.bodyRendered)

    return box
}

export function fileOf(options: {
    idOrData: string|BoxData, 
    name?: string,
    parent: FolderBox, 
    rendered?: boolean,
    bodyRendered?: boolean
}): FileBox {
    let mapData: BoxData
    if (options.idOrData instanceof BoxData) {
        mapData = options.idOrData
    } else {
        mapData = new BoxData(options.idOrData, 20, 20, 60, 60, [], [])
    }
    const name = options.name ?? mapData.id+'Name'

    const box = new FileBox(name, options.parent, mapData, false)
    box.saveMapData = () => Promise.resolve()
    setRenderStateToBox(box, options.rendered)
    setRenderStateToBoxBody(box.body, options.bodyRendered)

    return box
}

function setRenderStateToBox(box: Box, rendered?: boolean): void {
    if (rendered) {
        const renderState: RenderState = (box as any).renderState
        renderState.setRenderStarted()
        renderState.setRenderFinished()
    }
}

function setRenderStateToBoxBody(boxBody: BoxBody, rendered?: boolean): void {
    if (rendered) {
        const renderState: RenderState = (boxBody as any).renderState
        renderState.setRenderStarted()
        renderState.setRenderFinished()
    }
}