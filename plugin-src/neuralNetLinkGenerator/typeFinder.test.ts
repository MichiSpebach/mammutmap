import * as typeFinder from './typeFinder'

test('findTypesInText', () => {
    expect(typeFinder.findTypesInText(['type'], '')).toEqual([])
    expect(typeFinder.findTypesInText(['type'], '\n')).toEqual([])

    expect(typeFinder.findTypesInText(['type'], 'type')).toEqual(['type'])
    expect(typeFinder.findTypesInText(['Type'], 'Type')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], 'type')).toEqual([])

    expect(typeFinder.findTypesInText(['Type'], ' Type')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], 'Type ')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], ' Type ')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], '  Type')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], '\tType')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], '.Type')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], 'Type(')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], '.Type(')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], 'Type\n')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], 'Type;')).toEqual(['Type'])

    expect(typeFinder.findTypesInText(['Type'], 'OtherType')).toEqual([])
    expect(typeFinder.findTypesInText(['Type'], 'TypeOther')).toEqual([])
    expect(typeFinder.findTypesInText(['Type'], 'Type9')).toEqual([])
    expect(typeFinder.findTypesInText(['Type'], '9Type')).toEqual([])
    expect(typeFinder.findTypesInText(['Type'], 'some text Type some text')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], 'some text')).toEqual([])
})

test('findTypesInText multiple types', () => {
    expect(typeFinder.findTypesInText(['Type', 'OtherType'], 'OtherType Type')).toEqual(['Type', 'OtherType'])
    expect(typeFinder.findTypesInText(['Type', 'OtherType'], 'Type some text OtherType')).toEqual(['Type', 'OtherType'])
    expect(typeFinder.findTypesInText(['Type', 'OtherType'], 'some text OtherType')).toEqual(['OtherType'])
})

test('findTypesInText same type repeats', () => {
    expect(typeFinder.findTypesInText(['Type'], 'Type Type')).toEqual(['Type'])
    expect(typeFinder.findTypesInText(['Type'], 'Type some text Type')).toEqual(['Type'])
})
