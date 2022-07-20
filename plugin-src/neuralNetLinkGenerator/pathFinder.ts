
export function findPaths(text: string): string[] {
    let paths: string[] = []

    paths = paths.concat(findPathsWithMarkers(text, '^', '/', '', '\\s;'))
    paths = paths.concat(findPathsWithMarkers(text, '\\s', '/', '', '\\s;').map(path => path.trim()))
    paths = paths.concat(findPathsWithMarkers(text, "'", '/', "'"))
    paths = paths.concat(findPathsWithMarkers(text, '"', '/', '"'))

    paths = paths.concat(findPathsWithMarkersAndNormalize(text, '^', '\\', '', '\\s;'))
    paths = paths.concat(findPathsWithMarkersAndNormalize(text, '\\s', '\\', '', '\\s;').map(path => path.trim()))
    paths = paths.concat(findPathsWithMarkersAndNormalize(text, "'", '\\', "'"))
    paths = paths.concat(findPathsWithMarkersAndNormalize(text, '"', '\\', '"'))

    paths = paths.concat(findPathsWithMarkersAndNormalize(text, 'import ', '.', '', '\\s\\*;'))

    return paths
}

function findPathsWithMarkersAndNormalize(text: string, start: string, separator: string, end: string, additionalForbiddings?: string): string[] {
    return findPathsWithMarkers(text, start, separator, end, additionalForbiddings).map(path => path.replaceAll(separator, '/'))
}

function findPathsWithMarkers(text: string, start: string, separator: string, end: string, additionalForbiddings: string = ''): string[] {
    const paths: string[] = []

    const forbiddings: string = `'"/\\\\${additionalForbiddings}`
    const pathElement: string = `[^${forbiddings}]*[\\${separator}][^${forbiddings}]*`
    const pathMatches: IterableIterator<RegExpMatchArray> = text.matchAll(new RegExp(`${start}(?:${pathElement})+${end}`, 'g'))
    for (const pathMatch of pathMatches) {
        let path: string = pathMatch.toString()
        if (path.startsWith(start)) {
            path = path.substring(start.length)
        }
        if (path.endsWith(end)) {
            path = path.substring(0, path.length-end.length)
        }
        if (path.length > 1) {
            paths.push(path)
        }
    }

    return paths
}
