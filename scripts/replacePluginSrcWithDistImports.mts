import { Stats } from 'fs'
import * as fs from 'fs/promises'

console.log(`replacing plugin '../src/' and 'mammutmap/' imports with '../dist/' imports`)
await runOnEachFileInDirectoryRecursively('plugin', replaceSrcWithDistImports)

async function runOnEachFileInDirectoryRecursively(directoryPath: string, toRun: (filePath: string, recursionDepth: number) => Promise<void>, recursionDepth: number = 1): Promise<void> {
	const dirents: string[] = await fs.readdir(directoryPath)
	await Promise.all(dirents.map(async dirent => {
		const path: string = directoryPath+'/'+dirent
		const stat: Stats = await fs.stat(path)
		if (stat.isFile()) {
			if (path.endsWith('.js')) {
				await toRun(path, recursionDepth)
			}
		} else if (stat.isDirectory()) {
			await runOnEachFileInDirectoryRecursively(path, toRun, recursionDepth+1)
		} else {
			console.warn(`"${path}" is neither file nor directory.`)
		}
	}))
}

async function replaceSrcWithDistImports(filePath: string, recursionDepth: number): Promise<void> {
	const pathStart: string = '../'.repeat(recursionDepth)
	let content: string = await fs.readFile(filePath, {encoding: 'utf8'})
	content = content.replaceAll(`../src/`, `../dist/`)
	content = content.replaceAll(` from 'mammutmap/`, ` from '${pathStart}dist/`)
	content = content.replaceAll(` from "mammutmap/`, ` from "${pathStart}dist/`)
	content = content.replaceAll(` = require("mammutmap/`, ` = require("${pathStart}dist/`)
	await fs.writeFile(filePath, content)
}