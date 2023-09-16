"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade_1 = require("../dist/pluginFacade");
pluginFacade_1.applicationMenu.addMenuItemTo('tutorialHelloWorld.js', new pluginFacade_1.MenuItemFile({ label: 'perform Hello World!', click: () => performHelloWorld() }));
function performHelloWorld() {
    pluginFacade_1.PopupWidget.newAndRender({
        title: 'Hello World!',
        content: {
            type: 'div',
            style: { color: 'lightgreen', cursor: 'pointer' },
            onclick: () => console.log('Hello World!'),
            children: 'Hello, nice to see you!'
        },
        onClose: () => console.log('Have a nice day!')
    });
}
