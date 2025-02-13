/**
 * copied from '../../../test/core/box/factories/boxFactory'
 * importing from 'test' would lead to imports from 'src' and not from 'dist' which would result in other modules
 * TODO: find better solution
 * */
import { BoxData } from '../../../dist/core/mapData/BoxData'
import { FolderBox } from '../../../dist/core/box/FolderBox'
import { RootFolderBox } from '../../../dist/core/box/RootFolderBox'
import { ClientRect } from '../../../dist/core/ClientRect'
import { ProjectSettings } from '../../../dist/core/ProjectSettings'
import { RenderState } from '../../../dist/core/util/RenderState'
import { Box } from '../../../dist/core/box/Box'
import * as mapSettingsDataFactory from './mapSettingsDataFactory'
import * as projectSettingsFactory from './projectSettingsFactory'
import { BoxContext } from '../../../dist/core/box/BoxContext'
import { FileBox } from '../../../dist/core/box/FileBox'
import { MapSettingsData } from '../../../dist/core/mapData/MapSettingsData'
import { BoxBody } from '../../../dist/core/box/BoxBody'
import { dom } from '../../../dist/core/renderEngine/domAdapter'
import { RenderManager, renderManager } from '../../../dist/core/renderEngine/renderManager'

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