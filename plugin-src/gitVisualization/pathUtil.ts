export function isSubPathOrEqual(path: string, otherPath: string): boolean {
	if (path.startsWith(otherPath)) {
		const pathDiff: string = path.replace(otherPath, '')
		if (pathDiff === '' || pathDiff.match('^[/\\\\]')) {
			return true
		}
	}
	return false
}