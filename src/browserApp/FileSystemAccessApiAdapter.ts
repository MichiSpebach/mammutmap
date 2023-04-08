import { util } from '../core/util/util'
import { DirectoryStatsBasicImpl, Dirent, DirentBasicImpl, FileStatsBasicImpl, OpenDialogOptions, OpenDialogReturnValue, Stats, UnknownDirentKindStatsBasicImpl } from '../core/fileSystemAdapter'
import { AvailableFileSystemHandlesRegister } from './AvailableFileSystemHandlesRegister'
import { MessagePopup } from '../core/MessagePopup'

export class FileSystemAccessApiAdapter {

    private availableHandles: AvailableFileSystemHandlesRegister = new AvailableFileSystemHandlesRegister()

    public async doesDirentExistAndIsFile(path: string): Promise<boolean> {
        const result: FileSystemFileHandle|undefined = await this.availableHandles.findFileHandleByPathIfExists(path)
        return !!result
    }

    public async doesDirentExist(path: string): Promise<boolean> {
        const handle: FileSystemHandle|undefined = await this.availableHandles.findHandleByPathIfExists(path)
        return !!handle
    }

    public async getDirentStatsIfExists(path: string): Promise<Stats | null> {
        const handle: FileSystemHandle|undefined = await this.availableHandles.findHandleByPathIfExists(path)
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
        util.logWarning(`FileSystemAccessApiAdapter::getDirentStatsIfExists(..) path "${path}" does represent kind '${handle.kind}' that is not implemented, defaulting to 'UnknownDirentKindStatsBasicImpl'.`)
        return new UnknownDirentKindStatsBasicImpl(handle.kind)
    }

    public async readdir(path: string): Promise<Dirent[]> {
        const handle: FileSystemDirectoryHandle|Error[] = await this.availableHandles.findDirectoryHandleByPath(path)
        if (!(handle instanceof FileSystemDirectoryHandle)) {
            util.logWarning(`FileSystemAccessApiAdapter::readdir(..) failed at path '${path}', defaulting to empty list. Errors that appeared: ${handle}`)
            return []
        }
        const dirents: Dirent[] = []
        for await (const [key, value] of (handle as any).entries()) { // TODO: fix as any
            dirents.push(new DirentBasicImpl(value.name, value.kind))
        }
        return dirents
    }

    public async readFile(path: string): Promise<string> {
        const handle: FileSystemFileHandle|Error[] = await this.availableHandles.findFileHandleByPath(path)
        if (!(handle instanceof FileSystemHandle)) {
            util.logWarning(`FileSystemAccessApiAdapter::readFile(..) failed at path '${path}', defaulting to empty string. Errors that appeared: ${handle}`)
            return ''
        }
        const file: File = await handle.getFile()
        return file.text()
    }

    public readFileSync(path: string): string {
        throw new Error('Method not implemented.');
    }

    public async writeFile(path: string, data: string, options?: {throwInsteadOfWarn?: boolean}): Promise<void> {
        const result: FileSystemFileHandle|Error[] = await this.availableHandles.findFileHandleByPath(path, {create: true})
        if (!(result instanceof FileSystemHandle)) {
            const message = `FileSystemAccessApiAdapter::writeFile(..) couldn't find file at path '${path}' and failed to create it. Errors that appeared: ${result}`
            if (options?.throwInsteadOfWarn) {
                throw {name: 'NotFoundError', message}
            } else {
                util.logWarning(message)
            }
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
        util.logWarning(`FileSystemAccessApiAdapter::makeFolder(..) failed to make folder at path '${path}'. Errors that appeared: ${result}`)
    }

    public async symlink(existingPath: string, newPath: string, type?: 'dir' | 'file' | 'junction' | undefined): Promise<void> {
        util.logWarning('FileSystemAccessApiAdapter::symlink(..) not implemented yet.')
    }

    public async rename(oldPath: string, newPath: string): Promise<void> {
        util.logWarning('FileSystemAccessApiAdapter::rename(..) not implemented yet.')
    }

    public showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
        if (!options.properties) {
            util.logWarning(`FileSystemAccessApiAdapter::showOpenDialog(..) expected options.properties to be defined, defaulting to 'openDirectory'.`)
            return this.showDirectoryPicker()
        }
        if (options.properties.includes('openDirectory') && options.properties.includes('openFile')) {
            util.logWarning(`FileSystemAccessApiAdapter::showOpenDialog(..) options.properties contains 'openDirectory' and 'openFile', expected either or, defaulting to 'openDirectory'.`)
            return this.showDirectoryPicker()
        }
        if (options.properties.includes('openDirectory')) {
            return this.showDirectoryPicker()
        }
        if (options.properties.includes('openFile')) {
            return this.showFilePicker()
        }
        util.logWarning(`FileSystemAccessApiAdapter::showOpenDialog(..) options.properties contains neither 'openDirectory' nor 'openFile', defaulting to 'openDirectory'.`)
        return this.showDirectoryPicker()
    }

    private async showDirectoryPicker(): Promise<OpenDialogReturnValue|never> {
        let directoryHandle: FileSystemDirectoryHandle
        try {
            directoryHandle = await (window as any).showDirectoryPicker() // TODO: fix as any
        } catch (error: any) {
            this.showAndLogError(
                'Failed to show directory picker', 
                'showDirectoryPicker', 
                'https://developer.mozilla.org/en-US/docs/Web/API/window/showDirectoryPicker#browser_compatibility', 
                error
            )
        }
        this.availableHandles.addDirectoryHandle(directoryHandle)
        return {filePaths: [directoryHandle.name]}
    }
    
    private async showFilePicker(): Promise<OpenDialogReturnValue> {
        let fileHandle: FileSystemFileHandle
        try {
            fileHandle = await (window as any).showOpenFilePicker() // TODO: fix as any
        } catch (error: any) {
            this.showAndLogError(
                'Failed to show file picker', 
                'showOpenFilePicker',
                'https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker#browser_compatibility',
                error
            )
        }
        this.availableHandles.addFileHandle(fileHandle)
        return {filePaths: [fileHandle.name]}
    }

    private showAndLogError(title: string, featureName: string, featureWebLink: string, error: any): never {
        if (error instanceof TypeError) {
            this.showAndLogFileSystemAccessAPIFeatureNotAvailableError(title, featureName, featureWebLink, error)
        } else {
            this.showAndLogDefaultError(title, error)
        }
    }

    private showAndLogFileSystemAccessAPIFeatureNotAvailableError(title: string, featureName: string, featureWebLink: string, error: TypeError): never {
        const unsupportedFeature = `Most likely your browser does not support ${util.createWebLinkHtml(featureWebLink, featureName)} of the FileSystemsAccessAPI yet.`
        const secureContext = `Or secure context (HTTPS) is not active.`
        const recommendedBrowsers = 'Try it with a Chromium based browser, they support the FileSystemAccessAPI pretty well already.'
        const downloadDesktopVersion = `Or download the ${util.createWebLinkHtml(util.githubProjectAddress, 'desktop version')}.`
        const underlyingError = `Underlying Error is ${error}`
        const message = `${unsupportedFeature} ${secureContext}<br>${recommendedBrowsers}<br>${downloadDesktopVersion}<br>${underlyingError}`
        MessagePopup.buildAndRender(title, message)
        util.logError(`${title}. ${message}`, {allowHtml: true})
    }

    private showAndLogDefaultError(title: string, error: any): never {
        const underlyingError = `Underlying Error is ${error}`
        MessagePopup.buildAndRender(title, underlyingError)
        util.logError(`${title}. ${underlyingError}`)
    }

}