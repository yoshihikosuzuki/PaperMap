const {app, Menu, dialog} = require('electron')

let openingFile = ""

function openFile(win) {
  dialog.showOpenDialog({
    filters: [{name: 'JSON', extensions: ['json']}]
  }, (fileName) => {
    win.webContents.send('open', fileName[0])
  })
}

function saveFile(win) {
  if (openingFile === "") {
    saveFileAs(win)
  } else {
    win.webContents.send('save')
  }
}

function saveFileAs(win) {
  dialog.showSaveDialog({
    filters: [{name: 'JSON', extensions: ['json']}]
  }, (fileName) => {
    win.webContents.send('save-as', fileName)
  })
}

function createMenu(win) {
  const template = [
    {
      label: "File",
      submenu: [
        {label: "Open", accelerator: "Cmd+O", click: () => openFile(win)},
        {label: "Save", accelerator: "Cmd+S", click: () => saveFile(win)},
        {label: "Save As...", click: () => saveFileAs(win)}
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