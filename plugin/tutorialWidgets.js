"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Widget_1 = require("../dist/core/Widget");
const pluginFacade_1 = require("../dist/pluginFacade");
pluginFacade_1.applicationMenu.addMenuItemTo('tutorialWidgets.js', new pluginFacade_1.MenuItemFile({ label: 'show popup with widget', click: () => showPopupWithWidget() }));
async function showPopupWithWidget() {
    const widget = new TutorialWidget();
    pluginFacade_1.PopupWidget.newAndRender({
        title: widget.getId(),
        content: await widget.shapeForm(),
        onClose: () => widget.unrender()
    });
}
class TutorialWidget extends Widget_1.SimpleWidget {
    constructor() {
        super(...arguments);
        this.id = `tutorialWidget${pluginFacade_1.coreUtil.generateId()}`;
        this.type = 'div';
        this.counter = 0;
    }
    shapeFormInner() {
        return [
            {
                type: 'button',
                style: { width: '250px' },
                onclick: () => { this.counter++; this.render(); },
                children: '+1'
            },
            {
                type: 'div',
                style: { color: `rgb(0, ${this.counter * 10}, 0)` },
                children: `Count is ${this.counter}.`
            }
        ];
    }
}
