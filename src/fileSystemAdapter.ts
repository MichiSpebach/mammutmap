import * as fs from 'fs'
import { Dirent, promises as fsPromises } from 'fs'
import * as util from './util'
import { BoxMapData } from './box/BoxMapData'

export async function loadMapData(mapDataFilePath: string): Promise<BoxMapData|null> {
  return readFile(mapDataFilePath)
    .then(json => {
      return BoxMapData.buildFromJson(json)
    })
    .catch(_ => {
      return null
    })
}

export function readdir(path: string): Promise<Dirent[]> {
  return fsPromises.readdir(path, {withFileTypes: true})
}

export async function readFileAndConvertToHtml(path: string): Promise<string> {
  return util.escapeForHtml(await readFile(path))
}

export function readFile(path: string): Promise<string> {
  return fsPromises.readFile(path, 'utf-8')
}

export function readFileSync(path: string): string {
  return fs.readFileSync(path, 'utf-8')
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
