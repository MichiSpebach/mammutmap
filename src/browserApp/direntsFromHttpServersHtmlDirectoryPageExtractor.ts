import { Dirent } from '../core/fileSystemAdapter'
import { util } from '../core/util/util'

export function extract(htmlDirectoryPage: string): Dirent[] {
    const tableContentHtml: string = extractTableContent(htmlDirectoryPage)
    const rowsHtml: string[] = extractRowsFromTableContent(tableContentHtml)
    return rowsHtml.map(rowHtml => buildDirentFromRowHtml(rowHtml)).filter(dirent => dirent.name !== '../')
}

function extractTableContent(htmlDirectoryPage: string): string {
    const startIndex: number = getIndexOfExpectExactlyOne(htmlDirectoryPage, '<table>')
    const endIndex: number = getIndexOfExpectExactlyOne(htmlDirectoryPage, '</table>')
    return htmlDirectoryPage.substring(startIndex+'<table>'.length, endIndex)
}

function extractRowsFromTableContent(tableContentHtml: string): string[] {
    if (!tableContentHtml.startsWith('<tr>')) {
        util.logWarning('direntsFromHttpServersHtmlDirectoryPageExtractor tableContentHtml does not start with <tr>')
    } else {
        tableContentHtml = tableContentHtml.substring('<tr>'.length)
    }

    const rows: string[] = tableContentHtml.split('<tr>')

    return rows.map(row => {
        if (!row.endsWith('</tr>') && !row.endsWith('</tr>\n')) {
            util.logWarning(`direntsFromHttpServersHtmlDirectoryPageExtractor tableContentHtml row "${row}" does not end with </tr>`)
        } else {
            row = row.substring(0, tableContentHtml.lastIndexOf('</tr>'))
        }
        return row
    })
}

function buildDirentFromRowHtml(rowHtml: string): Dirent {
    const isFolder: boolean = rowHtml.includes('class="icon icon-_blank"')
    const nameStartIndex: number = getIndexOfExpectExactlyOne(rowHtml, '<a href="./')
    let name: string = rowHtml.substring(nameStartIndex+'<a href="./'.length) // removing beginning first makes detecting end more reliable
    name = name.substring(0, getIndexOfExpectExactlyOne(name, '">'))

    return {
        name,
        isFile: () => !isFolder,
        isDirectory: () => isFolder
    }
}

function getIndexOfExpectExactlyOne(text: string, searchString: string): number {
    const index: number = text.indexOf(searchString)
    if (index < 0) {
        util.logWarning(`direntsFromHttpServersHtmlDirectoryPageExtractor string does not contain "${searchString}".`)
    }
    if (index !== text.lastIndexOf(searchString)) {
        util.logWarning(`direntsFromHttpServersHtmlDirectoryPageExtractor string does contain more than one "${searchString}".`)
    }
    return index
}