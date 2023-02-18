import { Dirent, FileSystemAdapter, OpenDialogOptions, OpenDialogReturnValue, Stats } from './core/fileSystemAdapter'
import { util } from './core/util/util'
import * as direntsFromHttpServersHtmlDirectoryPageExtractor from './direntsFromHttpServersHtmlDirectoryPageExtractor'

export class BrowserFileSystemAdapter extends FileSystemAdapter {

    public async doesDirentExistAndIsFile(path: string): Promise<boolean> {
        if (this.isHostPath(path)) {
            const response: Response = await fetch(this.adjustHostPath(path))
            return response.ok // TODO: this does not check if dirent is a file
        }
        util.logWarning('BrowserFileSystemAdapter::doesDirentExistAndIsFile(..) not implemented for local fileSystem yet.')
        return false
    }

    public async doesDirentExist(path: string): Promise<boolean> {
        if (this.isHostPath(path)) {
            const response: Response = await fetch(this.adjustHostPath(path))
            return response.ok
        }
        util.logWarning('BrowserFileSystemAdapter::doesDirentExist(..) not implemented for local fileSystem yet.')
        return false
    }

    public async getDirentStatsIfExists(path: string): Promise<Stats | null> {
        util.logWarning('BrowserFileSystemAdapter::getDirentStatsIfExists(..) not implemented yet.')
        return null
    }

    public getDirentStatsOrThrow(path: string): Promise<Stats> {
        util.logError('BrowserFileSystemAdapter::getDirentStatsOrThrow(..) not implemented yet.')
    }

    public async readdir(path: string): Promise<Dirent[]> {
        if (this.isHostPath(path)) {
            const response: Response = await fetch(this.adjustHostPath(path))
            const htmlDirectoryPage: string = await response.text()
            return direntsFromHttpServersHtmlDirectoryPageExtractor.extract(htmlDirectoryPage) // TODO: in the long run also implement RESTful backend
        }
        util.logError(`BrowserFileSystemAdapter::readdir(..) not implemented for local fileSystem yet. Tried to read '${path}'.`)
    }

    public async readFile(path: string): Promise<string> {
        if (this.isHostPath(path)) {
            const response: Response = await fetch(this.adjustHostPath(path))
            return await response.text()
        }
        util.logError('BrowserFileSystemAdapter::readFile(..) not implemented for local fileSystem yet.')
    }

    private isHostPath(path: string): boolean {
        return path.startsWith('./')
    }

    private adjustHostPath(hostPath: string): string {
        return '.'+hostPath
    }

    public readFileSync(path: string): string {
        util.logError('BrowserFileSystemAdapter::readFileSync(..) not implemented yet.')
    }

    public async writeFile(path: string, data: string): Promise<void> {
        util.logWarning('BrowserFileSystemAdapter::writeFile(..) not implemented yet.')
    }

    public async makeFolder(path: string): Promise<void> {
        util.logWarning('BrowserFileSystemAdapter::makeFolder(..) not implemented yet.')
    }

    public async symlink(existingPath: string, newPath: string, type?: 'dir' | 'file' | 'junction' | undefined): Promise<void> {
        util.logWarning('BrowserFileSystemAdapter::symlink(..) not implemented yet.')
    }

    public async rename(oldPath: string, newPath: string): Promise<void> {
        util.logWarning('BrowserFileSystemAdapter::rename(..) not implemented yet.')
    }

    public showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
        util.logError('BrowserFileSystemAdapter::showOpenDialog(..) not implemented yet.')
    }
    
}