import * as gui from './guiAdapter'

module.exports = async() => {
  console.log('globalSetup started');
  await gui.startApp()
  console.log('globalSetup finished');
}
