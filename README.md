
### About
Visualize the source code of your entire project.\
Zoom out to get the rough structure, zoom in as deep as you want to get the details at an appropriate level.\
Customize the visualization and share your imagination through Git.\
Mammutmap visualizes source code in an UML-like diagram that updates with code changes.\
Mammutmap scales extremely well and can handle huge projects.

This is an early version but I am working frequently on improving it.

### Try it out
Browser version is hosted at https://www.mammutmap.com/, runs completely local in your browser, no data is sent back to the server, try it out!

There's now also a VSCode extension https://marketplace.visualstudio.com/items?itemName=mammutmap.mammutmap

Zooming works with scroll wheel or double click, moving with dragging mouse:\
![](https://github.com/MichiSpebach/mammutmap-vscode-extension/raw/HEAD/resources/navigation.gif)

Generating links works manually (right click) or with a link generation plugin (also accessible via right click):\
![](https://github.com/MichiSpebach/mammutmap-vscode-extension/raw/HEAD/resources/generateLinks.gif)

### Feedback and contributions are welcome
https://github.com/MichiSpebach/mammutmap/issues\
Also as Mammutmap is written in TypeScript it is very simple to write plugins for it.

### Install libraries
`npm install`

### Start Electron version
(run `npm install` first)\
`npm start`

### Start browser version
(run `npm install` first)\
`npm run buildApp`\
`npm run buildPlugins`\
(if not installed yet: `npm install http-server --global` or use http-server of your choice)\
From the project folder (the folder this README is in) run:\
`http-server ../ --ext js -c no-cache`\
Mammutmap should now be available at:\
http://localhost:8080/mammutmap/dist/browserApp/index.html

### Execute tests
Run unit tests:\
`npm test`

Run e2e tests:\
`npm run testE2e`

### Deploy
Create executable file in "out"-folder:\
`npm run package`

Create additionally installation files like .deb and .rpm (Linux) or .nupkg and .exe (Windows) in "out"-folder:\
`npm run make`
>When following error occurs\
"*Error: Cannot make for rpm, the following external binaries need to be installed: rpmbuild*"\
you need to install rpm before:\
`sudo apt install rpm`
