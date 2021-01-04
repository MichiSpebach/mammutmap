import * as fs from 'fs'
import { Dirent, promises as fsPromises } from 'fs'
import * as util from './util'

export function readdirSync(path: string): Dirent[] {
  return fs.readdirSync(path, { withFileTypes: true })
}

export function readFile(path: string): Promise<string> {
  return fsPromises.readFile(path, 'utf-8')
}

export function readFileAndConvertToHtml(path: string, callback: (dataConvertedToHtml: string) => void): void|never {
  fs.readFile(path, 'utf-8', (err: NodeJS.ErrnoException | null, data: string) => {
    if(err) {
      util.logError('fileSystemAdapter::readFile, ' + path + ', ' + err.message)
    } else {
      callback(util.escapeForHtml(data))
    }
  })
}

export async function writeFile(path: string, data: string): Promise<void> {
  let directory = ''
  const fileEntries: string[] = path.split('/')
  for (let i = 0; i < fileEntries.length - 1; i++) {
    directory += fileEntries[i] + '/'
  }

  await fsPromises.mkdir(directory, {recursive: true})
  return fsPromises.writeFile(path, data)
}

export async function rename(oldPath: string, newPath: string): Promise<void> {
  return fsPromises.rename(oldPath, newPath)
}
