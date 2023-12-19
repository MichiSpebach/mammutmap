
export function findPaths(text: string): string[] {
    let paths: string[] = []
    const brackets: string = '()\\[\\]{}'
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, `(?:^|[${brackets}\\s])`, '/\\\\', `${brackets}\\s;`)))
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, `['"]`, '/\\\\', '', `['"]`)))
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, 'import |from ', '.', '\\s\\*;')))
    return paths
}

function postProcessPaths(paths: string[]): string[] {
    paths = paths.filter(path => !path.startsWith('https://') && !path.startsWith('http://') && !path.startsWith('//'))
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
    return findPathsWithMarkers(text, start, separator, additionalForbiddings, end).map(path => path.replaceAll(new RegExp(`[${separator}]`, 'g'), '/'))
}

function findPathsWithMarkers(text: string, start: string, separator: string, additionalForbiddings: string = '', end?: string): string[] {
    // there is no neural net yet, for now the name just stays as buzzword xD
    const paths: string[] = []

    const forbiddings: string = `'"/\\\\\n${additionalForbiddings}`
    const pathElement: string = `[^${forbiddings}]*[${separator}][^${forbiddings}]*`
    const suffixCaptor: string = '(?<suffix>.|\\s|$)' // using capturing group that matches everything to avoid catastrophic backtracking
    const pathMatches: IterableIterator<RegExpMatchArray> = text.matchAll(new RegExp(`(?<path>(?<=${start})(?:${pathElement})+${suffixCaptor})`, 'g'))
    for (const pathMatch of pathMatches) {
        if (!pathMatch.groups) {
            console.warn(`pathFinder.findPathsWithMarkers(..) pathMatch has no groups`)
            continue
        }
        let path: string = pathMatch.groups.path
        const suffix: string = pathMatch.groups.suffix
        if (!path || path.length < 1 || suffix === undefined) {
            console.warn(`pathFinder.findPathsWithMarkers(..) path '${path}' or suffix '${suffix}' is not set`)
            continue
        }
        if (end && !suffix.match(end)) {
            continue
        }
        if (!path.endsWith(suffix)) {
            console.warn(`pathFinder.findPathsWithMarkers(..) path '${path}' does not end with suffix '${suffix}'`)
            continue
        }
        path = path.substring(0, path.length-suffix.length)
        if (path.length < 2) {
            continue
        }
        paths.push(path)
    }

    return paths
}
