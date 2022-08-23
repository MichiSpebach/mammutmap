"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MenuItemFile_1 = require("../dist/applicationMenu/MenuItemFile");
const applicationMenu_1 = require("../dist/applicationMenu");
const WizardWidget_1 = require("./pactCycleDetector/WizardWidget");
applicationMenu_1.applicationMenu.addMenuItemTo('pactCycleDetector.js', new MenuItemFile_1.MenuItemFile({ label: 'detect...', click: openWizard }));
async function openWizard() {
    new WizardWidget_1.WizardWidget().render();
}
