import { Dirent, FileSystemAdapter, OpenDialogOptions, OpenDialogReturnValue, Stats } from '../core/fileSystemAdapter'
import { util } from '../core/util/util'
import * as direntsFromHttpServersHtmlDirectoryPageExtractor from './direntsFromHttpServersHtmlDirectoryPageExtractor'

export class BrowserFileSystemAdapter extends FileSystemAdapter {

    private directoryHandles: FileSystemDirectoryHandle[] = []
    private fileHandles: FileSystemFileHandle[] = []

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
        return '../.'+hostPath // index.html and index.ts are in dist/browserApp/, so need to move up two folders to find e.g. './settings.json' on host server
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

    public async showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
        if (!options.properties) {
            util.logWarning(`BrowserFileSystemAdapter::showOpenDialog(..) expected options.properties to be defined, defaulting to 'openDirectory'.`)
            return this.showDirectoryPicker()
        }
        if (options.properties.includes('openDirectory') && options.properties.includes('openFile')) {
            util.logWarning(`BrowserFileSystemAdapter::showOpenDialog(..) options.properties contains 'openDirectory' and 'openFile', expected either or, defaulting to 'openDirectory'.`)
            return this.showDirectoryPicker()
        }
        if (options.properties.includes('openDirectory')) {
            return this.showDirectoryPicker()
        }
        if (options.properties.includes('openFile')) {
            return this.showFilePicker()
        }
        util.logWarning(`BrowserFileSystemAdapter::showOpenDialog(..) options.properties contains neither 'openDirectory' nor 'openFile', defaulting to 'openDirectory'.`)
        return this.showDirectoryPicker()
    }
    
    private async showDirectoryPicker(): Promise<OpenDialogReturnValue> {
        const directoryHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker() // TODO: fix as any
        this.directoryHandles.unshift(directoryHandle) // unshift to search in newer handles first
        return {filePaths: [directoryHandle.name]}
    }
    
    private async showFilePicker(): Promise<OpenDialogReturnValue> {
        const fileHandle: FileSystemFileHandle = await (window as any).showOpenFilePicker() // TODO: fix as any
        this.fileHandles.unshift(fileHandle) // unshift to search in newer handles first
        return {filePaths: [fileHandle.name]}
    }
    
}