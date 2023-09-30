"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade_1 = require("../dist/pluginFacade");
pluginFacade_1.applicationMenu.addMenuItemTo('tutorialRenderManager.js', new pluginFacade_1.MenuItemFile({ label: 'add element', click: () => addElement() }));
async function addElement() {
    const id = pluginFacade_1.coreUtil.generateId();
    const removeButton = {
        type: 'button',
        style: {
            display: 'block',
            margin: 'auto',
            marginTop: '10px',
            cursor: 'pointer'
        },
        onclick: () => pluginFacade_1.renderManager.remove(id),
        children: 'Remove Element'
    };
    await pluginFacade_1.renderManager.addElementTo('body', {
        type: 'div',
        id,
        style: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.5s',
            backgroundColor: '#1248',
            padding: '10px',
            border: 'solid 1px',
            borderRadius: '4px'
        },
        onmouseenter: () => highlightElement(id),
        onmouseleave: () => resetElement(id),
        children: [
            { type: 'div', children: 'Use RenderPriority.RESPONSIVE to prioritize render operations over other render operations' },
            { type: 'div', children: 'to achieve responsiveness for them when other render operations are queued up.' },
            { type: 'div', children: 'But save RenderPriority.RESPONSIVE for the things that really need to be responsive.' },
            removeButton
        ]
    });
}
async function highlightElement(elementId) {
    await pluginFacade_1.renderManager.addStyleTo(elementId, { color: 'skyblue' }, pluginFacade_1.RenderPriority.RESPONSIVE);
}
async function resetElement(elementId) {
    await pluginFacade_1.renderManager.addStyleTo(elementId, { color: null }, pluginFacade_1.RenderPriority.RESPONSIVE);
}
