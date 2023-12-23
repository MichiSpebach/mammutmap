import { isSubPathOrEqual } from './pathUtil'

test('isSubPathOrEqual paths are different but start similarly', async () => {
    const path: string = "/home/plugin-src/git"
    const otherPath: string = "/home/plugin"
    expect(isSubPathOrEqual(path, otherPath)).toBe(false)
})

test('isSubPathOrEqual paths are different', async () => {
    const path: string = "/home/plugin-src/git"
    const otherPath: string = "/home/plugin/git"
    expect(isSubPathOrEqual(path, otherPath)).toBe(false)
})

test('isSubPathOrEqual other path is sub-path of path', async () => {
    const path: string = "/home/plugin-src/git/gitWitch.ts"
    const otherPath: string = "/home/plugin-src/git"
    expect(isSubPathOrEqual(path, otherPath)).toBe(true)
})

test('isSubPathOrEqual paths are equal', async () => {
    const path: string = "/home/plugin-src/git/"
    const otherPath: string = "/home/plugin-src/git"
    expect(isSubPathOrEqual(path, otherPath)).toBe(true)
})