
### About
Zoomable map for source code.
Visualize source code in an UML-like diagram that updates with code changes and also be able to share the visualization through Git.

### Try it out in browser
Browser version is hosted at https://www.mammutmap.com/, runs completely local in your browser, no data is sent back to the server, try it out!

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
