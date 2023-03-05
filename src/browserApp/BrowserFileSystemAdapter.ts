import { DirectoryStatsBasicImpl, Dirent, DirentBasicImpl, FileStatsBasicImpl, FileSystemAdapter, OpenDialogOptions, OpenDialogReturnValue, Stats, UnknownDirentKindStatsBasicImpl } from '../core/fileSystemAdapter'
import { util } from '../core/util/util'
import * as direntsFromHttpServersHtmlDirectoryPageExtractor from './direntsFromHttpServersHtmlDirectoryPageExtractor'

export class BrowserFileSystemAdapter extends FileSystemAdapter {

    private directoryHandles: FileSystemDirectoryHandle[] = []
    private fileHandles: FileSystemFileHandle[] = []

    public async doesDirentExistAndIsFile(path: string): Promise<boolean> {
        if (this.isHostPath(path)) {
            const response: Response = await this.fetchFromHostServer(path)
            return response.ok // TODO: this does not check if dirent is a file
        }

        const handle: FileSystemHandle|undefined = await this.findHandleByPath(path)
        return handle?.kind === 'file'
    }

    public async doesDirentExist(path: string): Promise<boolean> {
        if (this.isHostPath(path)) {
            const response: Response = await this.fetchFromHostServer(path)
            return response.ok
        }

        const handle: FileSystemHandle|undefined = await this.findHandleByPath(path)
        return !!handle
    }

    public async getDirentStatsIfExists(path: string): Promise<Stats|null> {
        const handle: FileSystemHandle|undefined = await this.findHandleByPath(path)
        if (!handle) {
            return null
        }
        if (handle.kind === 'file' && handle instanceof FileSystemFileHandle) {
            const file: File = await handle.getFile()
            return new FileStatsBasicImpl(file.size)
        }
        if (handle.kind === 'directory' && handle instanceof FileSystemDirectoryHandle) {
            return new DirectoryStatsBasicImpl()
        }
        util.logWarning(`BrowserFileSystemAdapter::getDirentStatsIfExists(..) path "${path}" does represent kind '${handle.kind}' that is not implemented, defaulting to 'UnknownDirentKindStatsBasicImpl'.`)
        return new UnknownDirentKindStatsBasicImpl(handle.kind)
    }

    public async getDirentStatsOrThrow(path: string): Promise<Stats>|never {
        const stats: Stats|null = await this.getDirentStatsIfExists(path)
        if (!stats) {
            util.logError(`BrowserFileSystemAdapter::getDirentStatsOrThrow(..) path "${path}" not found.`)
        }
        return stats
    }

    public async readdir(path: string): Promise<Dirent[]> {
        if (this.isHostPath(path)) {
            const response: Response = await this.fetchFromHostServer(path)
            const htmlDirectoryPage: string = await response.text()
            return direntsFromHttpServersHtmlDirectoryPageExtractor.extract(htmlDirectoryPage) // TODO: in the long run also implement RESTful backend
        }

        const handle: FileSystemHandle|undefined = await this.findHandleByPath(path)
        if (!handle) {
            util.logWarning(`BrowserFileSystemAdapter::readdir(..) path '${path}' not found, defaulting to empty list.`)
            return []
        }
        if (handle.kind !== 'directory') {
            util.logWarning(`BrowserFileSystemAdapter::readdir(..) expected path '${path}' to be of kind 'directory' but is '${handle.kind}', defaulting to empty list.`)
            return []
        }
        const dirents: Dirent[] = []
        for await (const [key, value] of (handle as any).entries()) { // TODO: fix as any
            dirents.push(new DirentBasicImpl(value.name, value.kind))
        }
        return dirents
    }

    public async readFile(path: string): Promise<string> {
        if (this.isHostPath(path)) {
            const response: Response = await fetch(this.adjustHostPath(path))
            return await response.text()
        }

        const handle: FileSystemHandle|undefined = await this.findHandleByPath(path)
        if (!handle) {
            util.logWarning(`BrowserFileSystemAdapter::readFile(..) path '${path}' not found, defaulting to empty string.`)
            return ''
        }
        if (handle.kind !== 'file' || !(handle instanceof FileSystemFileHandle)) {
            util.logWarning(`BrowserFileSystemAdapter::readFile(..) expected path '${path}' to be of kind 'file' but is '${handle.kind}', defaulting to empty string.`)
            return ''
        }
        const file: File = await handle.getFile()
        return file.text()
    }

    private isHostPath(path: string): boolean {
        return path.startsWith('./')
    }

    private adjustHostPath(hostPath: string): string {
        return '../.'+hostPath // index.html and index.ts are in dist/browserApp/, so need to move up two folders to find e.g. './settings.json' on host server
    }

    private fetchFromHostServer(path: string): Promise<Response> {
        return fetch(this.adjustHostPath(path), {cache: 'no-store'}) // TODO: configure http-server correctly and use cache: 'no-cache'
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

    private async findHandleByPath(path: string): Promise<FileSystemHandle|undefined> {
        const restElements: string[] = util.getElementsOfPath(path)
        const firstElement: string|undefined = restElements.shift()
        if (!firstElement) {
            util.logWarning(`BrowserFileSystemAdapter::findHandleByPath(..) path "${path}" is empty, defaulting to undefined.`)
            return undefined
        }

        for (const searchHandle of this.directoryHandles) {
            if (searchHandle.name !== firstElement) {
                continue
            }
            if (restElements.length === 0) {
                return searchHandle
            }
            const resultHandle: FileSystemHandle|undefined = await this.findHandleByPathInDirectoryRecursive(restElements, searchHandle)
            if (resultHandle) {
                return resultHandle
            }
        }
        return undefined
    }

    private async findHandleByPathInDirectoryRecursive(pathElements: string[], directoryHandle: FileSystemDirectoryHandle): Promise<FileSystemHandle|undefined> {
        const firstElement: string|undefined = pathElements.shift()
        if (!firstElement) {
            util.logWarning(`BrowserFileSystemAdapter::findHandleByPathInDirectoryRecursive(..) path "${firstElement}" is empty, defaulting to undefined.`)
            return undefined
        }
        
        for await (const [key, value] of (directoryHandle as any).entries()) { // TODO: fix as any
            if (key !== firstElement) {
                continue
            }
            if (pathElements.length === 0) {
                return value
            }
            if (value.kind === 'directory') {
                return this.findHandleByPathInDirectoryRecursive(pathElements, value)
            }
            util.logWarning('BrowserFileSystemAdapter::findHandleByPathInDirectoryRecursive(..) matching handle does not represent a directory but there are remaining pathElements, defaulting to undefined.')
            return undefined
        }

        return undefined
    }
    
}