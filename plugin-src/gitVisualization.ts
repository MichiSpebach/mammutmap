import { mainWidget } from '../dist/pluginFacade'
import { GitVisualizationToolbarView } from './gitVisualization/toolbar/GitVisualizationToolbarView'

mainWidget.sidebar.addView(new GitVisualizationToolbarView('GitVisualization'))