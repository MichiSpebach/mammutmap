import { mock, MockProxy } from 'jest-mock-extended'
import { HoverManager } from '../src/HoverManager'
import { Hoverable } from '../src/Hoverable'
import { RenderManager, init as initRenderManager } from '../src/RenderManager'

test('addHoverable, element is already hovered and mouseover is not fired because it was fired before mouseover listener was added', async () => {
    const renderManager: MockProxy<RenderManager> = mock<RenderManager>()
    initRenderManager(renderManager)
    const hoverable: MockProxy<Hoverable> = mock<Hoverable>()
    let onHoverOverCounter: number = 0
    let onHoverOutCounter: number = 0

    hoverable.getId.calledWith().mockReturnValue('elementId')
    renderManager.isElementHovered.calledWith('elementId').mockReturnValue(Promise.resolve(true))

    await HoverManager.addHoverable(hoverable, () => onHoverOverCounter++, () => onHoverOutCounter++)

    expect(renderManager.isElementHovered).toBeCalledTimes(1)
    expect(onHoverOverCounter).toBe(1)
    expect(onHoverOutCounter).toBe(0)
})

test('addHoverable, mouseover happens while event listener is added but shortly before so event listener is not fired', async () => {
    const renderManager: MockProxy<RenderManager> = mock<RenderManager>()
    initRenderManager(renderManager)
    const hoverable: MockProxy<Hoverable> = mock<Hoverable>()
    let onHoverOverCounter: number = 0
    let onHoverOutCounter: number = 0
    let elementHovered: boolean = false

    hoverable.getId.calledWith().mockReturnValue('elementId')
    renderManager.isElementHovered.calledWith('elementId').mockImplementation(() => Promise.resolve(elementHovered))
    renderManager.addEventListenerTo.mockImplementation(() => {
        elementHovered = true
        return Promise.resolve()
    })

    await HoverManager.addHoverable(hoverable, () => onHoverOverCounter++, () => onHoverOutCounter++)

    expect(renderManager.addEventListenerTo).toBeCalledTimes(1)
    expect(renderManager.isElementHovered).toBeCalledTimes(1)
    expect(onHoverOverCounter).toBe(1)
    expect(onHoverOutCounter).toBe(0)
})
