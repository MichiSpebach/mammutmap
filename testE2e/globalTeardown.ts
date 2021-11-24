import * as gui from './guiAdapter'

module.exports = async() => {
  console.log('globalTeardown started');
  await gui.shutdownApp()
  console.log('globalTeardown finished');
}
