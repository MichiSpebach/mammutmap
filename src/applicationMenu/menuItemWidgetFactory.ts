import { util } from '../util'
import { MenuItemFileWidget } from './MenuItemFileWidget'
import { MenuItemFolderWidget } from './MenuItemFolderWidget'
import { MenuItemWidget } from './MenuItemWidget'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'

export function of(menuItem: MenuItemFile|MenuItemFolder): MenuItemWidget<MenuItemFile|MenuItemFolder> {
    if (menuItem instanceof MenuItemFile) {
        return new MenuItemFileWidget(menuItem)
    } else if (menuItem instanceof MenuItemFolder) {
        return new MenuItemFolderWidget(menuItem)
    } else {
        util.logWarning('MenuItem is neither a MenuItemFile nor a MenuItemFolder, render it as MenuItemFileWidget.')
        return new MenuItemFileWidget(menuItem)
    }
}