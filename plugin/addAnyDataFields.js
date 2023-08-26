"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = require("../dist/core/Map");
const pluginFacade_1 = require("../dist/pluginFacade");
// TODO make something like this possible:
/*import { plugin } from '../dist/pluginFacade'
plugin.getName()
plugin.getMenuItemFolder()
applicationMenu.addMenuItemTo(plugin.getMenuItemFolder(), ...)
plugin.applicationMenuItemFolder.addItem(...)*/
//applicationMenu.addMenuItemTo('saveAnyFields.js', new MenuItemFile({label: 'setAnyApplicationSetting', click: () => setAnyApplicationSetting()}))
pluginFacade_1.applicationMenu.addMenuItemTo('saveAnyFields.js', new pluginFacade_1.MenuItemFile({ label: 'setAnyBoxMapDataField', click: () => setAnyBoxMapDataField() }));
// TODO this does not work yet but should work like this in future
async function setAnyApplicationSetting() {
    let anyValue = pluginFacade_1.applicationSettings.getRawField('anyField');
    if (typeof anyValue === 'number') {
        console.log(`anyField is a number and its value is ${anyValue}`);
        anyValue++;
    }
    else {
        console.log(`anyField is ${anyValue}`);
        anyValue = 0;
    }
    await pluginFacade_1.applicationSettings.setRawField('anyField', anyValue);
    console.log(`set and saved anyField to ${anyValue}`);
}
async function setAnyBoxMapDataField() {
    if (!Map_1.map) {
        console.warn('no map is loaded');
        return;
    }
    const box = Map_1.map.getRootFolder();
    const fieldName = 'anyField';
    let fieldValue = box.getMapData().getRawField(fieldName);
    if (typeof fieldValue === 'number') {
        console.log(`${fieldName} is a number and its value is ${fieldValue}`);
        fieldValue++;
    }
    else {
        console.log(`${fieldName} is ${fieldValue}`);
        fieldValue = 0;
    }
    box.getMapData().setRawField(fieldName, fieldValue);
    await box.saveMapData(); // don't forget to call box.saveMapData()
    console.log(`set '${fieldName}' to '${fieldValue}' and saved to '${box.getMapDataFilePath()}'`);
}
