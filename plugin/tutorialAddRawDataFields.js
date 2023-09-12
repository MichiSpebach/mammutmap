"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = require("../dist/core/Map");
const pluginFacade_1 = require("../dist/pluginFacade");
// TODO make something like this possible:
/*import { plugin } from '../dist/pluginFacade'
import { thisPlugin } from '../dist/pluginFacade'
plugin.getName()
plugin.getMenuItemFolder()
applicationMenu.addMenuItemTo(plugin.getMenuItemFolder(), ...)
plugin.applicationMenuItemFolder.addItem(...)*/
pluginFacade_1.applicationMenu.addMenuItemTo('tutorialAddRawDataFields.js', new pluginFacade_1.MenuItemFile({ label: 'setAnyBoxMapDataField', click: () => setAnyBoxMapDataField() }));
pluginFacade_1.applicationMenu.addMenuItemTo('tutorialAddRawDataFields.js', new pluginFacade_1.MenuItemFile({ label: 'setAnyProjectSetting', click: () => setAnyProjectSetting() }));
pluginFacade_1.applicationMenu.addMenuItemTo('tutorialAddRawDataFields.js', new pluginFacade_1.MenuItemFile({ label: 'setAnyApplicationSetting', click: () => setAnyApplicationSetting() }));
async function setAnyBoxMapDataField() {
    if (!Map_1.map) {
        console.warn('tutorialAddRawDataFields.js plugin: no map is loaded');
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
/**
 * saving fields to projectSettings is basically the same as saving them to the mapData of the rootFolder
 * though projectSettings directly calls saveToFileSystem()
 */
async function setAnyProjectSetting() {
    if (!Map_1.map) {
        console.warn('addAnyDataFields.js plugin: no map(=project) is loaded');
        return;
    }
    const fieldName = 'anyField';
    let fieldValue = Map_1.map.getProjectSettings().getRawField(fieldName);
    if (typeof fieldValue === 'number') {
        console.log(`${fieldName} is a number and its value is ${fieldValue}`);
        fieldValue++;
    }
    else {
        console.log(`${fieldName} is ${fieldValue}`);
        fieldValue = 0;
    }
    await Map_1.map.getProjectSettings().setRawFieldAndSave(fieldName, fieldValue);
    console.log(`set '${fieldName}' to '${fieldValue}' and saved to '${Map_1.map.getProjectSettings().getProjectSettingsFilePath()}'`);
}
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
