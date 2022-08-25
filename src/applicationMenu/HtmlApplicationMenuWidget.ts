import { renderManager } from '../RenderManager'
import { Widget } from '../Widget'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'

export class HtmlApplicationMenuWidget extends Widget {

    private readonly id: string
    private readonly menuTree: MenuItemFolder

    public constructor(id: string, menuTree: MenuItemFolder) {
        super()
        this.id = id
        this.menuTree = menuTree
    }

    public getId(): string {
        return this.id
    }

    private getHtmlIdOf(menuItem: MenuItemFile|MenuItemFolder): string {
        return this.getId()+menuItem.id
    }

    public async render(): Promise<void> {
        await renderManager.setContentTo(this.getId(), this.formMenuBarHtml())
    }

    private formMenuBarHtml(): string {
        return this.menuTree.submenu.map(menu => this.formTopMenuHtml(menu)).join(' ')
    }

    private formTopMenuHtml(menuItem: MenuItemFile|MenuItemFolder): string {
        return `<span id="${this.getHtmlIdOf(menuItem)}">${menuItem.label}</span>`
    }

    private formMenuFolderHtml(menuItem: MenuItemFolder): string {
        return `<div id="${menuItem.id}">${menuItem.label}</div>`
    }

}