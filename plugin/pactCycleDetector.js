"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const applicationMenu = require("../dist/applicationMenu");
const WizardWidget_1 = require("./pactCycleDetector/WizardWidget");
applicationMenu.addMenuItemTo('pactCycleDetector.js', new electron_1.MenuItem({ label: 'detect...', click: openWizard }));
async function openWizard() {
    new WizardWidget_1.WizardWidget().render();
}
