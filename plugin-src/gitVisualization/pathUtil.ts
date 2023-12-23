export function isSubPathOrEqual(path: string, otherPath: string): boolean {
    if (path.startsWith(otherPath)) {
        const subfix: string = path.replace(otherPath, '')
        console.log(subfix)
        if (subfix.trim().length === 0 || subfix.match('^[/\\\\]')) {
            return true
        }
    }
    return false
}