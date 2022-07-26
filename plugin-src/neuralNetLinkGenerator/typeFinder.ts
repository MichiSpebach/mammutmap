
export function findTypesInText(types: string[], text: string): string[] {
    const foundTypes: string[] = []

    for (const type of types) {
        const typeMatches: IterableIterator<RegExpMatchArray> = text.matchAll(new RegExp(`(?:^|[^\\w])(?:${type})(?:[^\\w]|$)`, 'g'))

        for (const typeMatch of typeMatches) {
            let foundType: string = typeMatch.toString()
            if (foundType.match(new RegExp('^[^\\w]'))) {
                foundType = foundType.substring(1)
            }
            if (foundType.match(new RegExp('[^\\w]$'))) {
                foundType = foundType.substring(0, foundType.length-1)
            }
            if (!foundTypes.includes(foundType)) {
                foundTypes.push(foundType)
            }
        }
    }

    return foundTypes
}
