
export function findPaths(text: string): string[] {
    let paths: string[] = []

    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkers(text, '^', '/', '\\s;')))
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkers(text, '\\s', '/', '\\s;').map(path => path.trim())))
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkers(text, "'", '/', '', "'")))
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkers(text, '"', '/', '', '"')))

    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, '^', '\\', '\\s;')))
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, '\\s', '\\','\\s;').map(path => path.trim())))
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, "'", '\\', '', "'")))
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, '"', '\\', '', '"')))

    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, 'import ', '.', '\\s\\*;')))

    return paths
}

function postProcessPaths(paths: string[]): string[] {
    return paths.map(path => {
        if (path.startsWith('package:')) {
            path = path.substring('package:'.length)
        }
        return path.trim()
    })
}

function concatToPathsIfNotIncluded(paths: string[], otherPaths: string[]): void {
    for (const otherPath of otherPaths) {
        if (!paths.includes(otherPath)) {
            paths.push(otherPath)
        }
    }
}

function findPathsWithMarkersAndNormalize(text: string, start: string, separator: string, additionalForbiddings?: string, end?: string): string[] {
    return findPathsWithMarkers(text, start, separator, additionalForbiddings, end).map(path => path.replaceAll(separator, '/'))
}

function findPathsWithMarkers(text: string, start: string, separator: string, additionalForbiddings: string = '', end?: string): string[] {
    // there is no neural net yet, for now the name just stays as buzzword xD
    const paths: string[] = []

    const forbiddings: string = `'"/\\\\\n${additionalForbiddings}`
    const pathElement: string = `[^${forbiddings}]*[\\${separator}][^${forbiddings}]*`
    const suffixCaptor: string = '(.|\\s|$)' // using capturing group that matches everything to avoid catastrophic backtracking
    const pathMatches: IterableIterator<RegExpMatchArray> = text.matchAll(new RegExp(`${start}(?:${pathElement})+${suffixCaptor}`, 'g'))
    for (const pathMatch of pathMatches) {
        let path: string = pathMatch[0]
        let suffix: string = pathMatch[1]
        if (end && end !== suffix) {
            continue
        }
        if (path.startsWith(start)) {
            path = path.substring(start.length)
        }
        if (path.endsWith(suffix)) {
            path = path.substring(0, path.length-suffix.length)
        }
        if (path.length > 1) {
            paths.push(path)
        }
    }

    return paths
}
