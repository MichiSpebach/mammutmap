import * as pathFinder from './pathFinder'

test('findPaths', () => {
    expect(pathFinder.findPaths('not a path')).toEqual([])
    expect(pathFinder.findPaths('.')).toEqual([])
    expect(pathFinder.findPaths('/')).toEqual([])
    expect(pathFinder.findPaths('\\')).toEqual([])
    expect(pathFinder.findPaths('not a path.')).toEqual([])

    expect(pathFinder.findPaths('path/separated/with/slashes')).toEqual(['path/separated/with/slashes'])
    expect(pathFinder.findPaths("'path/separated/with/slashes'")).toEqual(['path/separated/with/slashes'])
    expect(pathFinder.findPaths('"path/separated/with/slashes"')).toEqual(['path/separated/with/slashes'])

    expect(pathFinder.findPaths('path\\separated\\with\\backslashes')).toEqual(['path/separated/with/backslashes'])
    expect(pathFinder.findPaths("'path\\separated\\with\\backslashes'")).toEqual(['path/separated/with/backslashes'])
    expect(pathFinder.findPaths('"path\\separated\\with\\backslashes"')).toEqual(['path/separated/with/backslashes'])
    
    expect(pathFinder.findPaths('import path.separated.with.dots')).toEqual(['path/separated/with/dots'])
    expect(pathFinder.findPaths('import complete.folder.*')).toEqual(['complete/folder/'])
    expect(pathFinder.findPaths('object.field.method')).toEqual([])
    
    expect(pathFinder.findPaths('path/separated/with/slashes.fileEnding')).toEqual(['path/separated/with/slashes.fileEnding'])
    expect(pathFinder.findPaths('path/separated/with/slashes.multiple.fileEndings')).toEqual(['path/separated/with/slashes.multiple.fileEndings'])
    expect(pathFinder.findPaths("'path/separated/with/slashes.fileEnding'")).toEqual(['path/separated/with/slashes.fileEnding'])
    expect(pathFinder.findPaths("'path/separated/with/slashes.multiple.fileEndings'")).toEqual(['path/separated/with/slashes.multiple.fileEndings'])

    expect(pathFinder.findPaths("'path/in/quotes/with/white spaces'")).toEqual(['path/in/quotes/with/white spaces'])
    expect(pathFinder.findPaths('"path/in/quotes/with/white spaces"')).toEqual(['path/in/quotes/with/white spaces'])
})

test('findPaths with surroundings', () => {
    expect(pathFinder.findPaths('other stuff path/separated/with/slashes')).toEqual(['path/separated/with/slashes'])
    expect(pathFinder.findPaths('path/separated/with/slashes other stuff')).toEqual(['path/separated/with/slashes'])
    expect(pathFinder.findPaths('other stuff path/separated/with/slashes other stuff')).toEqual(['path/separated/with/slashes'])
    expect(pathFinder.findPaths('other stuff "path/separated/with/slashes" other stuff')).toEqual(['path/separated/with/slashes'])

    expect(pathFinder.findPaths('path/separated/with/slashes;')).toEqual(['path/separated/with/slashes'])
    expect(pathFinder.findPaths('\npath/separated/with/slashes')).toEqual(['path/separated/with/slashes'])
    expect(pathFinder.findPaths('\npath/separated/with/slashes;')).toEqual(['path/separated/with/slashes'])
    expect(pathFinder.findPaths('\npath/separated/with/slashes.fileEnding;')).toEqual(['path/separated/with/slashes.fileEnding'])

    expect(pathFinder.findPaths('other stuff path\\separated\\with\\backslashes other stuff')).toEqual(['path/separated/with/backslashes'])

    expect(pathFinder.findPaths('other stuff import path.separated.with.dots other stuff')).toEqual(['path/separated/with/dots'])
    expect(pathFinder.findPaths('other stuff text.separated.with.dots other stuff')).toEqual([])
    expect(pathFinder.findPaths('other stuff import complete.folder.* other stuff')).toEqual(['complete/folder/'])
    expect(pathFinder.findPaths('other stuff import complete.folder.*; other stuff')).toEqual(['complete/folder/'])
})

test('findPaths with mountPoints', () => {
    expect(pathFinder.findPaths('./path')).toEqual(['./path'])
    expect(pathFinder.findPaths("'./path'")).toEqual(['./path'])
    expect(pathFinder.findPaths('"./path"')).toEqual(['./path'])

    expect(pathFinder.findPaths('./path/separated/with/slashes')).toEqual(['./path/separated/with/slashes'])
    expect(pathFinder.findPaths("'./path/separated/with/slashes'")).toEqual(['./path/separated/with/slashes'])
    expect(pathFinder.findPaths('"./path/separated/with/slashes"')).toEqual(['./path/separated/with/slashes'])

    expect(pathFinder.findPaths('./path/separated/with/slashes.fileEnding')).toEqual(['./path/separated/with/slashes.fileEnding'])
    expect(pathFinder.findPaths("'./path/separated/with/slashes.fileEnding'")).toEqual(['./path/separated/with/slashes.fileEnding'])
    expect(pathFinder.findPaths('"./path/separated/with/slashes.fileEnding"')).toEqual(['./path/separated/with/slashes.fileEnding'])

    expect(pathFinder.findPaths('../path/separated/with/slashes')).toEqual(['../path/separated/with/slashes'])
    expect(pathFinder.findPaths("'../path/separated/with/slashes'")).toEqual(['../path/separated/with/slashes'])
    expect(pathFinder.findPaths('"../path/separated/with/slashes"')).toEqual(['../path/separated/with/slashes'])

    expect(pathFinder.findPaths('/path/separated/with/slashes')).toEqual(['/path/separated/with/slashes'])
    expect(pathFinder.findPaths("'/path/separated/with/slashes'")).toEqual(['/path/separated/with/slashes'])
    expect(pathFinder.findPaths('"/path/separated/with/slashes"')).toEqual(['/path/separated/with/slashes'])

    expect(pathFinder.findPaths('path/separated/with/slashes/')).toEqual(['path/separated/with/slashes/'])
    expect(pathFinder.findPaths("'path/separated/with/slashes/'")).toEqual(['path/separated/with/slashes/'])
    expect(pathFinder.findPaths('"path/separated/with/slashes/"')).toEqual(['path/separated/with/slashes/'])

    expect(pathFinder.findPaths('file://path/separated/with/slashes')).toEqual(['file://path/separated/with/slashes'])
    expect(pathFinder.findPaths("'file://path/separated/with/slashes'")).toEqual(['file://path/separated/with/slashes'])
    expect(pathFinder.findPaths('"file://path/separated/with/slashes"')).toEqual(['file://path/separated/with/slashes'])
})

test('findPaths multiple paths in text', () => {
    let text: string = 'path/separated/with/slashes\n'
    text += 'not a path'
    text += '"other/path/separated/with/slashes"'

    expect(pathFinder.findPaths(text)).toEqual([
        'path/separated/with/slashes',
        'other/path/separated/with/slashes'
    ])
})

test('findPaths multiple unquoted paths in text', () => {
    let text: string = 'path/separated/with/slashes\n'
    text += 'other/path/separated/with/slashes'

    expect(pathFinder.findPaths(text)).toEqual([
        'path/separated/with/slashes',
        'other/path/separated/with/slashes'
    ])
})

test('findPaths quotes in text not belonging to paths', () => {
    let text: string = '"some text" path/separated/with/slashes\n'
    text += 'some "other text"'

    expect(pathFinder.findPaths(text)).toEqual([
        'path/separated/with/slashes'
    ])
})

test('findPaths same path repeats', () => {
    let text: string = 'path/separated/with/slashes\n'
    text += 'not a path'
    text += '"path/separated/with/slashes"'

    expect(pathFinder.findPaths(text)).toEqual([
        'path/separated/with/slashes'
    ])
})

test('findPaths mulitple paths embedded in text', () => {
    let text: string = 'some longer text before that is not a path\n'
    text += '"path/separated/with/slashes"\n'
    text += 'some text path/without/quotes some text\n'
    text += '"other/path/separated/with/slashes"\n'
    text += 'some longer text after that is not a path'

    expect(pathFinder.findPaths(text)).toEqual([
        'path/without/quotes',
        'path/separated/with/slashes',
        'other/path/separated/with/slashes'
    ])
})

test('findPaths open quote without ending does not lead to catastrophic backtracking', () => {
    let text: string = '\'sometextsometextsometextsometextsometextsometext'
    text += '/sometextsometextsometextsometextsometextsometext'
    text += '/sometextsometextsometextsometextsometextsometext'
    text += '/sometextsometextsometextsometextsometextsometext'
    text += '/sometextsometextsometextsometextsometextsometext'
    text += '/sometextsometextsometextsometextsometextsometext'
    text += '/sometextsometextsometextsometextsometextsometext'
    expect(pathFinder.findPaths(text)).toEqual([])
}, 50)
