/**
 * copied from '../../../test/core/box/factories/boxFactory'
 * importing from 'test' would lead to imports from 'src' and not from 'dist' which would result in other modules
 * TODO: find better solution
 * */
import { BoxData } from '../../../src/core/mapData/BoxData'
import { FolderBox } from '../../../src/core/box/FolderBox'
import { RootFolderBox } from '../../../src/core/box/RootFolderBox'
import { ClientRect } from '../../../src/core/ClientRect'
import { ProjectSettings } from '../../../src/core/ProjectSettings'
import { RenderState } from '../../../src/core/util/RenderState'
import { Box } from '../../../src/core/box/Box'
import * as mapSettingsDataFactory from './mapSettingsDataFactory'
import * as projectSettingsFactory from './projectSettingsFactory'
import { BoxContext } from '../../../src/core/box/BoxContext'
import { FileBox } from '../../../src/core/box/FileBox'
import { MapSettingsData } from '../../../src/core/mapData/MapSettingsData'
import { BoxBody } from '../../../src/core/box/BoxBody'
import { dom } from '../../../src/core/renderEngine/domAdapter'
import { RenderManager, renderManager } from '../../../src/core/renderEngine/renderManager'

export function rootFolderOf(options: {
    idOrSettings: string|MapSettingsData|ProjectSettings, 
    rendered?: boolean,
    bodyRendered?: boolean,
    getClientRect?: () => Promise<ClientRect>,
    getMapClientRect?: () => Promise<ClientRect>
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
        getMapClientRect: options.getMapClientRect?? (() => Promise.resolve(new ClientRect(0, 0, 1600, 800)))
    }

    const box = new RootFolderBox(context, 'idRenderedInto')
    if (options.getClientRect) {
        box.getClientRect = options.getClientRect
    } else {
        box.getClientRect = () => Promise.resolve(new ClientRect(1600*0.2, 800*0.2, 1600*0.6, 800*0.6)) // TODO: aspectRatio depending on mapData, normally square
    }
    box.saveMapData = () => Promise.resolve()
    setRenderStateToBox(box, options.rendered)
    setRenderStateToBoxBody(box.body, options.bodyRendered)

    return box
}

export function folderOf(options: {
    idOrData: string|BoxData, 
    name?: string,
    parent: FolderBox,
    addToParent: boolean,
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
    if (options.addToParent) {
        addBoxToParentOrWarn({box, parent: options.parent})
    }

    return box
}

export function fileOf(options: {
    idOrData: string|BoxData, 
    name?: string,
    parent: FolderBox,
    addToParent: boolean,
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
    if (options.addToParent) {
        addBoxToParentOrWarn({box, parent: options.parent})
    }

    return box
}

export function setRenderStateToBox(box: Box, rendered?: boolean): void {
    if (rendered) {
        const renderState: RenderState = (box as any).renderState
        renderState.setRenderStarted()
        renderState.setRenderFinished()
    }
}

export function setRenderStateToBoxBody(boxBody: BoxBody, rendered?: boolean): void {
    if (rendered) {
        const renderState: RenderState = (boxBody as any).renderState
        renderState.setRenderStarted()
        renderState.setRenderFinished()
    }
}

function addBoxToParentOrWarn(options: {box: Box, parent: FolderBox}): void {
    if (dom || isRenderManagerMocked()) {
        options.parent.addBox(options.box) // calls renderManager.appendChildTo(parent.getId(), box.getId()) which calls domAdapter
    } else {
        console.warn('boxFactory::addBoxToParentOrWarn(..) renderManager is not mocked and dom is undefined, initialize renderManager or domAdapter with at least some mock.')
    }
}

function isRenderManagerMocked(): boolean {
    return !(renderManager instanceof RenderManager)
}