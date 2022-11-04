import { BoxData } from '../../../src/mapData/BoxData'
import { FolderBox } from '../../../src/box/FolderBox'
import { RootFolderBox } from '../../../src/box/RootFolderBox'
import { ClientRect } from '../../../src/ClientRect'
import { MapSettingsData } from '../../../src/mapData/MapSettingsData'
import { ProjectSettings } from '../../../src/ProjectSettings'

export function rootFolderOf(id: string): RootFolderBox {
    const mapData = new MapSettingsData({
        id,
        x: 20, y: 20, width: 60, height: 60,
        links: [],
        nodes: [],
        srcRootPath: 'fakeSrcRootPath',
        mapRootPath: 'fakeMapRootPath',
        linkTags: []
    })
    const projectSettings = new ProjectSettings('fakeProjectSettingsFilePath', mapData, false)
    const box = new RootFolderBox(projectSettings, '')
    box.getClientRect = () => Promise.resolve(new ClientRect(1600*0.2, 800*0.2, 1600*0.6, 800*0.6))
    box.saveMapData = () => Promise.resolve()
    return box
}

export function folderOf(id: string, parent: FolderBox): FolderBox {
    const mapData = new BoxData(id, 20, 20, 60, 60, [], [])
    const box = new FolderBox(id+'Name', parent, mapData, false)
    box.saveMapData = () => Promise.resolve()
    return box
}
