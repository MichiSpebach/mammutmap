import { BoxMapData } from '../../../src/box/BoxMapData'
import { FolderBox } from '../../../src/box/FolderBox'
import { RootFolderBox } from '../../../src/box/RootFolderBox'
import { ProjectSettings } from '../../../src/ProjectSettings'

export function rootFolderOf(id: string): RootFolderBox {
    const projectSettings = new ProjectSettings('fakeProjectSettingsFilePath', 'fakeSrcRootPath', 'fakeMapRootPath')
    const mapData = new BoxMapData(id, 30, 30, 40, 40, [], [])
    const box = new RootFolderBox(projectSettings, '', mapData, false)
    box.saveMapData = () => Promise.resolve()
    return box
}

export function folderOf(id: string, parent: FolderBox): FolderBox {
    const mapData = new BoxMapData(id, 30, 30, 40, 40, [], [])
    const box = new FolderBox(id+'Name', parent, mapData, false)
    box.saveMapData = () => Promise.resolve()
    return box
}
