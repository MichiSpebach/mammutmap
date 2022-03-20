
### About
Zoomable map for source code.
Visualize source code in an UML-like diagram that updates with code changes and also be able to share the visualization through Git.

### Install libraries
`npm install`

### Start
`npm start`

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
