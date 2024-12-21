import { mainWidget } from '../dist/pluginFacade'
import { PaintToolbarView, PaintToolbarViewWidget } from './paint/PaintToolbarView'

mainWidget.sidebar.addView(new PaintToolbarView())
//mainWidget.sidebar.addView({name: 'Paint', widget: new PaintToolbarViewWidget()}) // TODO would be simpler