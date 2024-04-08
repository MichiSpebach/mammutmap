import { isSubPathOrEqual } from './pathUtil'

test('isSubPathOrEqual paths are different but start similarly', () => {
	const path: string = '/home/plugin-src/git'
	const otherPath: string = '/home/plugin'
	expect(isSubPathOrEqual(path, otherPath)).toBe(false)
})

test('isSubPathOrEqual paths are different', () => {
	const path: string = '/home/plugin-src/git'
	const otherPath: string = '/home/plugin/git'
	expect(isSubPathOrEqual(path, otherPath)).toBe(false)
})

test('isSubPathOrEqual other path is sub-path of path', () => {
	const path: string = '/home/plugin-src/git/gitWitch.ts'
	const otherPath: string = '/home/plugin-src/git'
	expect(isSubPathOrEqual(path, otherPath)).toBe(true)
})

test('isSubPathOrEqual paths are equal', () => {
	const path: string = '/home/plugin-src/git/'
	const otherPath: string = '/home/plugin-src/git'
	expect(isSubPathOrEqual(path, otherPath)).toBe(true)
})