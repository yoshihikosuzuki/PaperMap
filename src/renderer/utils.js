const {BrowserWindow, dialog} = require('electron').remote
const pdf = require('pdfjs-dist-for-node')
const PDFWindow = require('electron-pdf-window')

module.exports.existFile = function existFile(fileName) {
  try {
    fs.statSync(fileName)
    return true
  } catch(err) {
    if(err.code === 'ENOENT') {
      return false
    }
  }
}

module.exports.requirePdf = function requirePdf() {
  return dialog.showOpenDialog({   // synchronous
    filters: [{name: 'PDF', extensions: ['pdf']}]
  })[0]
}

module.exports.generateThumbnail = function generateThumbnail(inPdfFileName, outPngPrefix) {
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')

  return pdf.getDocument('file://' + resolve(inPdfFileName)).then(function(doc) {
    return doc.getPage(1).then(function(page) {
      let viewport = page.getViewport(1.0)
      canvas.height = viewport.height
      canvas.width = viewport.width
      let renderer = {
        canvasContext: ctx,
        viewport: viewport
      }
      return page.render(renderer).then(function() {
        return new Promise(function (resolve, reject) {
          ctx.globalCompositeOperation = 'destination-over'
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          let image = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
          fs.writeFileSync(outPngPrefix + '.png', image, 'base64')
          resolve()
        })
      })
    })
  })
}

module.exports.openPdf = function openPdf(fileName) {
  const win = new BrowserWindow({ width: 800, height: 1000 })
  PDFWindow.addSupport(win)
  win.loadURL("file://" + resolve(fileName))
}