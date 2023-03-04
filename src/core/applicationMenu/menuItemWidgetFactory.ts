import { util } from '../util/util'
import { MenuItemFileWidget } from './MenuItemFileWidget'
import { MenuItemFolderWidget } from './MenuItemFolderWidget'
import { MenuItemWidget } from './MenuItemWidget'
import { MenuItem } from './MenuItem'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'

export function of(menuItem: MenuItem, closeMenu: () => Promise<void>): MenuItemWidget<MenuItem> {
    if (menuItem instanceof MenuItemFile) {
        return new MenuItemFileWidget(menuItem, closeMenu)
    } else if (menuItem instanceof MenuItemFolder) {
        return new MenuItemFolderWidget(menuItem, closeMenu)
    } else {
        util.logWarning('MenuItem is neither a MenuItemFile nor a MenuItemFolder, render it as MenuItemFileWidget.')
        return new MenuItemFileWidget(menuItem as MenuItemFile, closeMenu)
    }
}