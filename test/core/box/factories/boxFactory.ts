import { BoxData } from '../../../../src/core/mapData/BoxData'
import { FolderBox } from '../../../../src/core/box/FolderBox'
import { RootFolderBox } from '../../../../src/core/box/RootFolderBox'
import { ClientRect } from '../../../../src/core/ClientRect'
import { ProjectSettings } from '../../../../src/core/ProjectSettings'
import { RenderState } from '../../../../src/core/util/RenderState'
import { Box } from '../../../../src/core/box/Box'
import * as projectSettingsFactory from '../../factories/projectSettingsFactory'

export function rootFolderOf(options: {
    idOrProjectSettings: string|ProjectSettings, 
    rendered?: boolean
}): RootFolderBox {
    let projectSettings: ProjectSettings
    if (options.idOrProjectSettings instanceof ProjectSettings) {
        projectSettings = options.idOrProjectSettings
    } else {
        projectSettings = projectSettingsFactory.of({id: options.idOrProjectSettings})
    }

    const box = new RootFolderBox(projectSettings, 'idRenderedInto')
    box.getClientRect = () => Promise.resolve(new ClientRect(1600*0.2, 800*0.2, 1600*0.6, 800*0.6))
    box.saveMapData = () => Promise.resolve()
    setRenderStateToBox(box, options.rendered)

    return box
}

export function folderOf(options: {
    idOrData: string|BoxData, 
    name?: string,
    parent: FolderBox, 
    rendered?: boolean
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

    return box
}

function setRenderStateToBox(box: Box, rendered?: boolean): void {
    if (rendered) {
        const renderState: RenderState = (box as any).renderState
        renderState.setRenderStarted()
        renderState.setRenderFinished()
    }
}
