
export function findPaths(text: string): string[] {
    let paths: string[] = []

    concatToPathsIfNotIncluded(paths, findPathsWithMarkers(text, '^', '/', '', '\\s;'))
    concatToPathsIfNotIncluded(paths, findPathsWithMarkers(text, '\\s', '/', '', '\\s;').map(path => path.trim()))
    concatToPathsIfNotIncluded(paths, findPathsWithMarkers(text, "'", '/', "'"))
    concatToPathsIfNotIncluded(paths, findPathsWithMarkers(text, '"', '/', '"'))

    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, '^', '\\', '', '\\s;'))
    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, '\\s', '\\', '', '\\s;').map(path => path.trim()))
    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, "'", '\\', "'"))
    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, '"', '\\', '"'))

    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, 'import ', '.', '', '\\s\\*;'))

    return paths
}

function concatToPathsIfNotIncluded(paths: string[], otherPaths: string[]): void {
    for (const otherPath of otherPaths) {
        if (!paths.includes(otherPath)) {
            paths.push(otherPath)
        }
    }
}

function findPathsWithMarkersAndNormalize(text: string, start: string, separator: string, end: string, additionalForbiddings?: string): string[] {
    return findPathsWithMarkers(text, start, separator, end, additionalForbiddings).map(path => path.replaceAll(separator, '/'))
}

function findPathsWithMarkers(text: string, start: string, separator: string, end: string, additionalForbiddings: string = ''): string[] {
    // there is no neural net yet, for now the name just stays as buzzword xD
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
