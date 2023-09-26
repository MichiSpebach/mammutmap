"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade_1 = require("../dist/pluginFacade");
const WizardWidget_1 = require("./pactCycleDetector/WizardWidget");
pluginFacade_1.applicationMenu.addMenuItemTo('pactCycleDetector.js', new pluginFacade_1.MenuItemFile({ label: 'detect...', click: openWizard }));
async function openWizard() {
    new WizardWidget_1.WizardWidget().render();
}
