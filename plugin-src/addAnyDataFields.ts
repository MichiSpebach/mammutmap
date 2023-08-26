import { map } from '../dist/core/Map'
import { Box, MenuItemFile, applicationMenu, applicationSettings } from '../dist/pluginFacade'
// TODO make something like this possible:
/*import { plugin } from '../dist/pluginFacade'
plugin.getName()
plugin.getMenuItemFolder()
applicationMenu.addMenuItemTo(plugin.getMenuItemFolder(), ...)
plugin.applicationMenuItemFolder.addItem(...)*/

//applicationMenu.addMenuItemTo('addAnyDataFields.js', new MenuItemFile({label: 'setAnyApplicationSetting', click: () => setAnyApplicationSetting()}))
applicationMenu.addMenuItemTo('addAnyDataFields.js', new MenuItemFile({label: 'setAnyBoxMapDataField', click: () => setAnyBoxMapDataField()}))

// TODO this does not work yet but should work like this in future
async function setAnyApplicationSetting(): Promise<void> {
    let anyValue: unknown = applicationSettings.getRawField('anyField')
    
    if (typeof anyValue === 'number') {
        console.log(`anyField is a number and its value is ${anyValue}`)
        anyValue++
    } else {
        console.log(`anyField is ${anyValue}`)
        anyValue = 0
    }
    
    await applicationSettings.setRawField('anyField', anyValue)
    console.log(`set and saved anyField to ${anyValue}`)
}

async function setAnyBoxMapDataField(): Promise<void> {
    if (!map) {
        console.warn('addAnyDataFields.js plugin: no map is loaded')
        return
    }

    const box: Box = map.getRootFolder()
    const fieldName = 'anyField'

    let fieldValue: unknown = box.getMapData().getRawField(fieldName)
    if (typeof fieldValue === 'number') {
        console.log(`${fieldName} is a number and its value is ${fieldValue}`)
        fieldValue++
    } else {
        console.log(`${fieldName} is ${fieldValue}`)
        fieldValue = 0
    }

    box.getMapData().setRawField(fieldName, fieldValue)
    await box.saveMapData() // don't forget to call box.saveMapData()
    console.log(`set '${fieldName}' to '${fieldValue}' and saved to '${box.getMapDataFilePath()}'`)
}