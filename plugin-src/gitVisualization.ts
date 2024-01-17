import { mainWidget } from '../dist/pluginFacade'
import { GitVisualizationToolbarView } from './gitVisualization/GitVisualizationToolbarView'

mainWidget.sidebar.addView(new GitVisualizationToolbarView('GitVisualization'))