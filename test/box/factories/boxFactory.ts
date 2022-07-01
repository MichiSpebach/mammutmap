import { BoxMapData } from '../../../src/box/BoxMapData'
import { FolderBox } from '../../../src/box/FolderBox'
import { RootFolderBox } from '../../../src/box/RootFolderBox'
import { ClientRect } from '../../../src/ClientRect'
import { ProjectSettings } from '../../../src/ProjectSettings'

export function rootFolderOf(id: string): RootFolderBox {
    const projectSettings = new ProjectSettings('fakeProjectSettingsFilePath', 'fakeSrcRootPath', 'fakeMapRootPath')
    const mapData = new BoxMapData(id, 30, 30, 40, 40, [], [])
    const box = new RootFolderBox(projectSettings, '', mapData, false)
    box.getClientRect = () => Promise.resolve(new ClientRect(1600*(30/100), 800*(30/100), 1600*(40/100), 800*(40/100)))
    box.saveMapData = () => Promise.resolve()
    return box
}

export function folderOf(id: string, parent: FolderBox): FolderBox {
    const mapData = new BoxMapData(id, 30, 30, 40, 40, [], [])
    const box = new FolderBox(id+'Name', parent, mapData, false)
    box.saveMapData = () => Promise.resolve()
    return box
}
