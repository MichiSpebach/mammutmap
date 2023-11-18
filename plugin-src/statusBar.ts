import { MenuItemFile, applicationMenu, renderManager, coreUtil, RenderPriority, RenderElement, RenderElements, getRootFolder } from '../dist/pluginFacade'
import { promises } from 'fs'

interface StatusBarItemData {
    name: string,
    value: string
}

applicationMenu.addMenuItemTo('statusBar.js', new MenuItemFile({ label: 'Toggle Statusbar', click: () => activate() }))

let visible = false

async function activate(): Promise<void> {

    visible = !visible

    await renderManager.addElementTo('body', {
        type: 'table',
        id: 'statusBarContent',
        style: {
            position: 'absolute',
            bottom: '0',
            backgroundColor: '#000000',
            height: '10px',
            width: '100%',
            border: 'solid 1px',
            borderRadius: '4px',
            visibility: visible ? 'visible' : 'hidden'
        },
        children: [

            {
                type: 'tr',
                children: await createStatusBarItems()
            }

        ]
    })
}

async function createStatusBarItems(itemDelimiter: string = ' || '): Promise<RenderElements> {
    const itemData: StatusBarItemData[] = [
        {
            name: 'Date/Time',
            value: getCurrentDateTime()
        },
        {
            name: 'Disk Usage',
            value: await getDiskUsage()
        }
    ]
    const renderElements: RenderElements[] = itemData.map((item) => {
        return [
            {
                type: 'td',
                style: {
                    width: '10%'
                },
                children: `${item.name} : ${item.value}`
            },
            {
                type: 'td',
                style: {
                    width: '10%'
                },
                children: itemDelimiter
            }
        ]
    })
    return renderElements.flat()
}

function getCurrentDateTime(): string {
    const date = new Date()
    return `${date.getDate()}.${date.getMonth()}.${date.getFullYear()} / ${date.getHours()}:${date.getMinutes()}`
}

async function getDiskUsage(): Promise<string> {
    const mapRootDirectory = getRootFolder().getSrcPath()
    const stats = await promises.statfs(mapRootDirectory)
    const totalSpace = stats.bsize * stats.bavail / 1024 / 1024 / 1024
    const usedSpace = totalSpace - (stats.bsize * stats.bfree)
    const percentage = usedSpace / (totalSpace / 100)
    return `${usedSpace}/${totalSpace} (${percentage}%)`
}
