import { BoxMapData } from '../../../src/box/BoxMapData'
import { FolderBox } from '../../../src/box/FolderBox'
import { RootFolderBox } from '../../../src/box/RootFolderBox'
import { ClientRect } from '../../../src/ClientRect'
import { ProjectSettings } from '../../../src/ProjectSettings'

export function rootFolderOf(id: string): RootFolderBox {
    const projectSettings = new ProjectSettings('fakeProjectSettingsFilePath', 'fakeSrcRootPath', 'fakeMapRootPath')
    const mapData = new BoxMapData(id, 20, 20, 60, 60, [], [])
    const box = new RootFolderBox(projectSettings, '', mapData, false)
    box.getClientRect = () => Promise.resolve(new ClientRect(1600*0.2, 800*0.2, 1600*0.6, 800*0.6))
    box.saveMapData = () => Promise.resolve()
    return box
}

export function folderOf(id: string, parent: FolderBox): FolderBox {
    const mapData = new BoxMapData(id, 20, 20, 60, 60, [], [])
    const box = new FolderBox(id+'Name', parent, mapData, false)
    box.saveMapData = () => Promise.resolve()
    return box
}
