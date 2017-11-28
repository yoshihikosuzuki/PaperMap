const {app, Menu, BrowserWindow, dialog} = require('electron')
const vg = require('./vg-main')

let openingFile = ""

function openFile(win) {
  dialog.showOpenDialog({
    filters: [{name: 'JSON', extensions: ['json']}]
  }, (fileName) => {
    openingFile = fileName[0]
    vg.loadGraphFromJSON(fileName[0])
    win.webContents.send('open')
  })
}

function saveFileAs() {
  dialog.showSaveDialog({
    filters: [{name: 'JSON', extensions: ['json']}]
  }, (fileName) => {
    vg.writeGraphToJSON(fileName)
  })
}

function createMenu(win) {
  const template = [
    {
      label: "File",
      submenu: [
        {label: "Open", accelerator: "Cmd+O", click: () => openFile(win)},
        {label: "Save", accelerator: "Cmd+S", click: () => vg.writeGraphToJSON(openingFile)},
        {label: "Save As...", click: () => saveFileAs()}
      ]
    },
    {
      label: "Edit",
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'pasteandmatchstyle'},
        {role: 'delete'},
        {role: 'selectall'}
      ]
    },
    {
      label: "View",
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'},
        {type: 'separator'},
        {role: 'togglefullscreen'}
      ]
    },
    {
      role: 'Window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'}
      ]
    }
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        {role: 'about'},
        {type: 'separator'},
        //{role: 'services', submenu: []},
        //{type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'}
      ]
    });
    template[4].submenu = [   // "Window"
      {role: 'close'},
      {role: 'minimize'},
      {role: 'zoom'},
      {type: 'separator'},
      {role: 'front'}
    ]
  
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = createMenu;