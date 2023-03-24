import { DirectoryStatsBasicImpl, Dirent, DirentBasicImpl, FileStatsBasicImpl, FileSystemAdapter, OpenDialogOptions, OpenDialogReturnValue, Stats, UnknownDirentKindStatsBasicImpl } from '../core/fileSystemAdapter'
import { util } from '../core/util/util'
import { AvailableFileSystemHandlesRegister } from './AvailableFileSystemHandlesRegister'
import * as direntsFromHttpServersHtmlDirectoryPageExtractor from './direntsFromHttpServersHtmlDirectoryPageExtractor'
import { MessagePopup } from '../core/MessagePopup'

export class BrowserFileSystemAdapter extends FileSystemAdapter {

    private availableHandles: AvailableFileSystemHandlesRegister = new AvailableFileSystemHandlesRegister()

    public async doesDirentExistAndIsFile(path: string): Promise<boolean> {
        if (this.isHostPath(path)) {
            const stats: Stats|null = await this.getDirentStatsIfExistsOfHostPath(path)
            return !!stats && stats.isFile()
        }

        const result: FileSystemHandle|Error[] = await this.availableHandles.findFileHandleByPath(path)
        if (result instanceof FileSystemHandle) {
            return true
        }
        const unexpectedErrors: Error[] = result.filter((error: Error) => !this.isNotFoundError(error) && !this.isTypeErrorBecauseOfUpNavigating(error, path))
        if (unexpectedErrors.length > 0) {
            util.logWarning(`BrowserFileSystemAdapter::doesDirentExistAndIsFile(..) couldn't find file at path '${path}'. Unexpected errors are: ${result}`)
        }
        return false
    }

    private isNotFoundError(error: Error): boolean {
        return error.name === 'NotFoundError'
    }

    private isTypeErrorBecauseOfUpNavigating(error: Error, path: string): boolean {
        return error.name === 'TypeError' && util.getElementsOfPath(path)[1] === '..'
    }

    public async doesDirentExist(path: string): Promise<boolean> {
        if (this.isHostPath(path)) {
            const response: Response = await this.fetchFromHostServer(path)
            return response.ok
        }

        const handle: FileSystemHandle|undefined = await this.availableHandles.findHandleByPath(path)
        return !!handle
    }

    public async getDirentStatsIfExists(path: string): Promise<Stats|null> {
        if (this.isHostPath(path)) {
            return this.getDirentStatsIfExistsOfHostPath(path)
        }

        // TODO: introduce and move into LocalFileSystemAdapter
        const handle: FileSystemHandle|undefined = await this.availableHandles.findHandleByPath(path)
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

    // TODO: introduce and move into HostServerFileSystemAdapter|HttpFileSystemAdapter
    private async getDirentStatsIfExistsOfHostPath(path: string): Promise<Stats|null> {
        const response: Response = await this.fetchFromHostServer(path)
            if (!response.ok) {
                return null
            }
            const blob: Blob = await response.blob()
            if (blob.type === 'video/mp2t') {
                return new FileStatsBasicImpl(blob.size)
            }
            if (blob.type === 'text/html') {
                return new DirectoryStatsBasicImpl()
            }
            util.logWarning(`BrowserFileSystemAdapter::getDirentStatsIfExists(..) unknown blobType '${blob.type}', defaulting to FileStats.`)
            return new FileStatsBasicImpl(blob.size)
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

        const handle: FileSystemHandle|undefined = await this.availableHandles.findHandleByPath(path)
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
            const response: Response = await this.fetchFromHostServer(path)
            return await response.text()
        }

        const handle: FileSystemHandle|undefined = await this.availableHandles.findHandleByPath(path)
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
        const result: FileSystemFileHandle|Error[] = await this.availableHandles.findFileHandleByPath(path, {create: true})
        if (!(result instanceof FileSystemHandle)) {
            util.logWarning(`BrowserFileSystemAdapter::writeFile(..) couldn't find file at path '${path}' and failed to create it. Errors that appeared: ${result}`)
            return
        }
        const writableFileStream/*: FileSystemWritableFileStream*/ = await (result as any).createWritable() // TODO: fix as any and outcommented type
        await writableFileStream.write(data)
        await writableFileStream.close()
    }

    public async makeFolder(path: string): Promise<void> {
        // TODO: log warning if folder already exists?
        const result: FileSystemDirectoryHandle|Error[] = await this.availableHandles.findDirectoryHandleByPath(path, {create: true})
        if (result instanceof FileSystemDirectoryHandle) {
            return
        }
        util.logWarning(`BrowserFileSystemAdapter::makeFolder(..) failed to make folder at path '${path}'. Errors that appeared: ${result}`)
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
    
    private async showDirectoryPicker(): Promise<OpenDialogReturnValue|never> {
        let directoryHandle: FileSystemDirectoryHandle
        try {
            directoryHandle = await (window as any).showDirectoryPicker() // TODO: fix as any
        } catch (error: any) {
            this.showAndLogError('Failed to show directory picker', error)
        }
        this.availableHandles.addDirectoryHandle(directoryHandle)
        return {filePaths: [directoryHandle.name]}
    }
    
    private async showFilePicker(): Promise<OpenDialogReturnValue> {
        let fileHandle: FileSystemFileHandle
        try {
            fileHandle = await (window as any).showOpenFilePicker() // TODO: fix as any
        } catch (error: any) {
            this.showAndLogError('Failed to show file picker', error)
        }
        this.availableHandles.addFileHandle(fileHandle)
        return {filePaths: [fileHandle.name]}
    }

    private showAndLogError(title: string, error: any): never {
        if (error instanceof TypeError) {
            this.showAndLogFileSystemAccessAPINotAvailableError(title, error)
        } else {
            this.showAndLogDefaultError(title, error)
        }
    }

    private showAndLogFileSystemAccessAPINotAvailableError(title: string, error: TypeError): never {
        const message = 'Most likely your browser does not support the FileSystemsAccessAPI yet.'
        const messageWithLink = `Most likely your browser does not support the ${util.createWebLinkHtml('https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API#browser_compatibility', 'FileSystemAccessAPI')} yet.`
        const recommendedBrowsers = 'Try it with a Chromium based browser, they support the FileSystemAccessAPI pretty well already.'
        const downloadDesktopVersion = 'Or download the desktop version.'
        const downloadDesktopVersionWithLink = `Or download the ${util.createWebLinkHtml(util.githubProjectAddress, 'desktop version')}.`
        const underlyingError = `Underlying Error is ${error}`
        MessagePopup.buildAndRender(title, `${messageWithLink}<br>${recommendedBrowsers}<br>${downloadDesktopVersionWithLink}<br>${underlyingError}`)
        util.logError(`${title}. ${message}\n${recommendedBrowsers} ${downloadDesktopVersion}\n${underlyingError}`)
    }

    private showAndLogDefaultError(title: string, error: any): never {
        const underlyingError = `Underlying Error is ${error}`
        MessagePopup.buildAndRender(title, underlyingError)
        util.logError(`${title}. ${underlyingError}`)
    }

}