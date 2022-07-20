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
