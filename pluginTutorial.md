### Writing Plugins for Mammutmap
It is kept as simple as possible to write plugins for Mammutmap.

### Write a Hello World plugin
Create a file `helloWorld.ts` in the `./plugin-src/` folder:
```typescript
import { coreUtil } from '../dist/pluginFacade'

coreUtil.logInfo('Hello World')
```
or even simpler:
```typescript
console.log('Hello World')
```

### Compile and run plugins
Run in the root directory of the Mammutmap project:\
`npm start`\
This compiles all plugins from `./plugin-src/` into `./plugin/` and starts Mammutmap. All `.js`-files in `./plugin/` are loaded on startup.\
In the Mammutmap terminal you should now see the logged text 'Hello World'.

### Example plugins
In `./plugin-src/` there are some example plugins that you can activate in the applicationMenu's `Plugins`-tab:
- [tutorialHelloWorld.ts](./plugin-src/tutorialHelloWorld.ts): A little bit more advanced HelloWorld that opens a popup.
- [tutorialBoxTabs.ts](./plugin-src/tutorialBoxTabs.ts): A plugin that let's you add tabs to boxes where you can render everything (meant for file/folder related stuff).
- [tutorialAddRawDataFields.ts](./plugin-src/tutorialAddRawDataFields.ts): A tutorial that let's you save arbitrary data in the boxMapData json files, the project settings and the application settings.json file.
- [tutorialRenderManager.ts](./plugin-src/tutorialRenderManager.ts): A more advanced example how to directly access the renderManager.
- [tutorialWidgets.ts](./plugin-src/tutorialWidgets.ts): An example that uses Widgets as pattern to structure frontend components