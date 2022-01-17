import * as fs from 'fs'
import { Dirent, promises as fsPromises } from 'fs'
import * as jsonMerger from 'json-merger'
import { util } from './util'
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

export async function saveMapData(mapDataFilePath: string, data: BoxMapData): Promise<void> {
  if (await doesDirentExist(mapDataFilePath)) {
    await mergeJsonIntoFile(mapDataFilePath, data.toJson())
      .catch(reason => util.logWarning('failed to merge mapData into '+mapDataFilePath+': '+reason))
  } else {
    await writeFile(mapDataFilePath, data.toJson())
      .catch(reason => util.logWarning('failed to save '+mapDataFilePath+': '+reason))
  }
}

export async function doesDirentExist(path: string): Promise<boolean> {
  try {
    await fsPromises.stat(path)
    return true
  } catch(_) {
    return false
  }
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

export async function mergeJsonIntoFile(path: string, json: string): Promise<void> {
  const originalJson: string = await readFile(path)
  const mergedJson: string = jsonMerger.mergeFiles([originalJson, json])
  await writeFile(path, mergedJson)
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
