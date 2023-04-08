import { util } from '../core/util/util'
import { DirectoryStatsBasicImpl, Dirent, FileStatsBasicImpl, Stats } from '../core/fileSystemAdapter'
import * as direntsFromHttpServersHtmlDirectoryPageExtractor from './direntsFromHttpServersHtmlDirectoryPageExtractor'

export class HostServerFileSystemAdapter {

    public async doesDirentExistAndIsFile(path: string): Promise<boolean> {
        const stats: Stats|null = await this.getDirentStatsIfExists(path)
        return !!stats && stats.isFile()
    }

    public async doesDirentExist(path: string): Promise<boolean> {
        const response: Response = await this.fetchFromHostServer(path)
        return response.ok
    }

    public async getDirentStatsIfExists(path: string): Promise<Stats | null> {
        const response: Response = await this.fetchFromHostServer(path)
        if (!response.ok) {
            return null
        }
        const blob: Blob = await response.blob()
        const fileMimeTypes: string[] = [
            'application/json',
            'application/javascript',
            'text/plain',
            'text/html',
            'text/css',
            'text/markdown',
            'video/mp2t',
            'application/octet-stream'
        ]
        if (fileMimeTypes.some((mimeType: string) => blob.type.startsWith(mimeType))) { // on some browsers blob.type is e.g. 'text/plain; charset=utf-8'
            return new FileStatsBasicImpl(blob.size)
        }
        if (blob.type === 'text/html') {
            return new DirectoryStatsBasicImpl()
        }
        util.logWarning(`HostServerFileSystemAdapter::getDirentStatsIfExists(..) unknown blobType '${blob.type}' at path '${path}', defaulting to FileStats.`)
        return new FileStatsBasicImpl(blob.size)
    }

    public async readdir(path: string): Promise<Dirent[]> {
        const response: Response = await this.fetchFromHostServer(path)
        const htmlDirectoryPage: string = await response.text()
        return direntsFromHttpServersHtmlDirectoryPageExtractor.extract(htmlDirectoryPage) // TODO: in the long run also implement RESTful backend
    }

    public async readFile(path: string): Promise<string> {
        const response: Response = await this.fetchFromHostServer(path)
        return await response.text()
    }

    public isHostPath(path: string): boolean {
        return path.startsWith('./')
    }

    private adjustHostPath(hostPath: string): string {
        return '../.'+hostPath // index.html and index.ts are in dist/browserApp/, so need to move up two folders to find e.g. './settings.json' on host server
    }

    private fetchFromHostServer(path: string): Promise<Response> {
        return fetch(this.adjustHostPath(path), {cache: 'no-store'}) // TODO: configure http-server correctly and use cache: 'no-cache'
    }

}