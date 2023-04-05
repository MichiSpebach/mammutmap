import { util } from '../core/util/util'

export class AvailableFileSystemHandlesRegister {

    private readonly directoryHandles: FileSystemDirectoryHandle[] = []
    private readonly fileHandles: FileSystemFileHandle[] = []

    public addDirectoryHandle(directory: FileSystemDirectoryHandle): void {
        this.directoryHandles.unshift(directory) // unshift to search in newer handles first
    }

    public addFileHandle(file: FileSystemFileHandle): void {
        this.fileHandles.unshift(file) // unshift to search in newer handles first
    }

    public async findHandleByPath(path: string): Promise<FileSystemHandle|Error[]> {
        const remainingElements: string[] = util.getElementsOfPath(path)
        const lastElement: string|undefined = remainingElements.pop()
        const firstElement: string|undefined = remainingElements.shift()

        if (!lastElement) {
            util.logWarning(`BrowserFileSystemAdapter::findHandleByPath(..) path "${path}" is empty.`)
            return []
        }

        if (!firstElement) {
            for (const searchHandle of this.fileHandles) {
                if (searchHandle.name === lastElement) {
                    return searchHandle
                }
            }
            return [new Error(`No available fileHandle has name '${lastElement}'.`)]
        }

        const errors: Error[] = []
        for (const searchHandle of this.directoryHandles) {
            if (searchHandle.name !== firstElement) {
                continue
            }
            const directoryHandle: FileSystemDirectoryHandle|Error = await this.findDirectoryHandleByPathInDirectoryRecursive(remainingElements.slice(), searchHandle) // copy with slice because elements are consumed
            if (!(directoryHandle instanceof FileSystemDirectoryHandle)) {
                errors.push(directoryHandle)
                continue
            }
            for await (const [key, value] of (directoryHandle as any).entries()) { // TODO: fix as any
                if (key === lastElement) {
                    return value
                }
            }
            errors.push({name: 'NotFoundError', message: `lastElement "${lastElement}" of path "${path}" not found.`})
        }
        return errors
    }

    // TODO: refactor, remove and use other recursive method instead
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

    public async findFileHandleByPath(filePath: string, options?: {create?: boolean}): Promise<FileSystemFileHandle|Error[]> {
        const remainingElements: string[] = util.getElementsOfPath(filePath)
        const fileName: string|undefined = remainingElements.pop()
        const firstElement: string|undefined = remainingElements.shift()

        if (!fileName) {
            util.logWarning(`BrowserFileSystemAdapter::findFileHandleByPath(..) path "${filePath}" is empty.`)
            return []
        }

        if (!firstElement) {
            for (const searchHandle of this.fileHandles) {
                if (searchHandle.name === fileName) {
                    return searchHandle
                }
            }
            return [new Error(`No available fileHandle has name '${fileName}'.`)]
        }

        const errors: Error[] = []
        for (const searchHandle of this.directoryHandles) {
            if (searchHandle.name !== firstElement) {
                continue
            }
            const result: FileSystemDirectoryHandle|Error = await this.findDirectoryHandleByPathInDirectoryRecursive(remainingElements.slice(), searchHandle, options) // copy with slice because elements are consumed
            if (!(result instanceof FileSystemDirectoryHandle)) {
                errors.push(result)
                continue
            }
            try {
                return await result.getFileHandle(fileName, options) // await important, otherwise catch will not work
            } catch (error: any) {
                errors.push(error)
            }
        }
        return errors
    }

    public async findDirectoryHandleByPath(directoryPath: string, options?: {create?: boolean}): Promise<FileSystemDirectoryHandle|Error[]> {
        const remainingElements: string[] = util.getElementsOfPath(directoryPath)
        const firstElement: string|undefined = remainingElements.shift()

        if (!firstElement) {
            util.logWarning(`BrowserFileSystemAdapter::findDirectoryHandleByPath(..) path "${directoryPath}" is empty.`)
            return []
        }

        const errors: Error[] = []
        for (const searchHandle of this.directoryHandles) {
            if (searchHandle.name !== firstElement) {
                continue
            }
            const result: FileSystemDirectoryHandle|Error = await this.findDirectoryHandleByPathInDirectoryRecursive(remainingElements.slice(), searchHandle, options) // copy with slice because elements are consumed
            if (result instanceof FileSystemDirectoryHandle) {
                return result
            }
            errors.push(result)
        }
        return errors
    }

    private async findDirectoryHandleByPathInDirectoryRecursive(/*consumes*/ remainingPathElements: string[], directoryHandle: FileSystemDirectoryHandle, options?: {create?: boolean}): Promise<FileSystemDirectoryHandle|Error> {
        const firstElement: string|undefined = remainingPathElements.shift()
        if (!firstElement) {
            return directoryHandle
        }
        let handle: FileSystemDirectoryHandle
        try {
            handle = await directoryHandle.getDirectoryHandle(firstElement, options)
        } catch (error: any) {
            return error
        }
        return this.findDirectoryHandleByPathInDirectoryRecursive(remainingPathElements, handle, options)
    }

}