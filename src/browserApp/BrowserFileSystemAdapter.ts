import { Dirent, FileSystemAdapter, OpenDialogOptions, OpenDialogReturnValue, Stats } from '../core/fileSystemAdapter'
import { util } from '../core/util/util'
import { HostServerFileSystemAdapter } from './HostServerFileSystemAdapter'
import { FileSystemAccessApiAdapter } from './FileSystemAccessApiAdapter'

export class BrowserFileSystemAdapter extends FileSystemAdapter {

    private hostServer: HostServerFileSystemAdapter = new HostServerFileSystemAdapter()
    private localFileSystem: FileSystemAccessApiAdapter = new FileSystemAccessApiAdapter()

    public async doesDirentExistAndIsFile(path: string): Promise<boolean> {
        if (this.hostServer.isHostPath(path)) {
            return this.hostServer.doesDirentExistAndIsFile(path)
        }

        return this.localFileSystem.doesDirentExistAndIsFile(path)
    }

    public async doesDirentExist(path: string): Promise<boolean> {
        if (this.hostServer.isHostPath(path)) {
            return this.hostServer.doesDirentExist(path)
        }

        return this.localFileSystem.doesDirentExist(path)
    }

    public async getDirentStatsIfExists(path: string): Promise<Stats|null> {
        if (this.hostServer.isHostPath(path)) {
            return this.hostServer.getDirentStatsIfExists(path)
        }

        return this.localFileSystem.getDirentStatsIfExists(path)
    }

    public async getDirentStatsOrThrow(path: string): Promise<Stats>|never {
        const stats: Stats|null = await this.getDirentStatsIfExists(path)
        if (!stats) {
            util.logError(`BrowserFileSystemAdapter::getDirentStatsOrThrow(..) path "${path}" not found.`)
        }
        return stats
    }

    public async readdir(path: string): Promise<Dirent[]> {
        if (this.hostServer.isHostPath(path)) {
            return this.hostServer.readdir(path)
        }

        return this.localFileSystem.readdir(path)
    }

    public async readFile(path: string): Promise<string> {
        if (this.hostServer.isHostPath(path)) {
            return this.hostServer.readFile(path)
        }

        return this.localFileSystem.readFile(path)
    }

    public readFileSync(path: string): string {
        util.logError('BrowserFileSystemAdapter::readFileSync(..) not implemented yet.')
    }

    public async writeFile(path: string, data: string, options?: {throwInsteadOfWarn?: boolean}): Promise<void> {
        if (this.hostServer.isHostPath(path)) {
            const message = `BrowserFileSystemAdapter::writeFile(..) on hostServer is not implemented, path "${path}" is interpreted as hostPath.`
            if (options?.throwInsteadOfWarn) {
                throw new Error(message) // TODO: introduce util.buildError(options: {name?: 'NotFoundError'|'NotImplementedError', message: string}): Error
            }
            util.logWarning(message)
            return
        }

        await this.localFileSystem.writeFile(path, data, options)
    }

    public async makeFolder(path: string): Promise<void> {
        if (this.hostServer.isHostPath(path)) {
            util.logWarning(`BrowserFileSystemAdapter::makeFolder(..) on hostServer is not implemented, path "${path}" is interpreted as hostPath.`)
            return
        }

        return this.localFileSystem.makeFolder(path)
    }

    public async symlink(existingPath: string, newPath: string, type?: 'dir' | 'file' | 'junction' | undefined): Promise<void> {
        if (this.hostServer.isHostPath(existingPath)) {
            util.logWarning(`BrowserFileSystemAdapter::symlink(..) on hostServer is not implemented, existingPath "${existingPath}" is interpreted as hostPath.`)
            return
        }
        if (this.hostServer.isHostPath(newPath)) {
            util.logWarning(`BrowserFileSystemAdapter::symlink(..) on hostServer is not implemented, newPath "${newPath}" is interpreted as hostPath.`)
            return
        }
        
        return this.localFileSystem.symlink(existingPath, newPath, type)
    }

    public async rename(oldPath: string, newPath: string): Promise<void> {
        if (this.hostServer.isHostPath(oldPath)) {
            util.logWarning(`BrowserFileSystemAdapter::rename(..) on hostServer is not implemented, oldPath "${oldPath}" is interpreted as hostPath.`)
            return
        }
        if (this.hostServer.isHostPath(newPath)) {
            util.logWarning(`BrowserFileSystemAdapter::rename(..) on hostServer is not implemented, newPath "${newPath}" is interpreted as hostPath.`)
            return
        }

        return this.localFileSystem.rename(oldPath, newPath)
    }

    public async showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
        return this.localFileSystem.showOpenDialog(options)
    }

}