const {ipcRenderer} = require('electron')
const {BrowserWindow, dialog} = require('electron').remote
const fs = require('fs')
const fsExtra = require('fs-extra')
const resolve = require('path').resolve
const Viva = require('vivagraphjs')
const pdf = require('pdfjs-dist-for-node')
const PDFWindow = require('electron-pdf-window')

let openingGraphFile = ""
let graph = Viva.Graph.graph()
let graphics = Viva.Graph.View.svgGraphics()
let layout
let renderer

monitorChangesOnGraph()

/* -----------------------------------------
        PaperMap-specific appearance
----------------------------------------- */

let nodeSize = 100
let linkLength = 200

// set custom node appearance
graphics.node(function(node) {
  // The function is called every time renderer needs a ui to display node
  let ui = Viva.Graph.svg('g')
  let svgText = Viva.Graph.svg('text').attr('y', '-4px').text(node.id)
  let img = Viva.Graph.svg('image')
            .attr('width', nodeSize)
            .attr('height', nodeSize)
            .link(node.data.png)   // => <image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=/path/to/png></image>
  ui.append(svgText)
  ui.append(img)
  $(ui).hover(function() {   // mouse over
    highlightRelatedNodes(node.id, true)
  }, function() {   // mouse out
    highlightRelatedNodes(node.id, false)
  })
  ui.addEventListener('click', function() {   // node click
    document.getElementById('detail').innerHTML = node.data.title
    //openPdf(node.data.pdf)
  })
  return ui
}).placeNode(function(nodeUI, pos) {
  nodeUI.attr('transform',
              'translate(' + (pos.x - nodeSize / 2) + ',' + (pos.y - nodeSize / 2) + ')')
})

/*
// set custom link appearance
graphics.link(function(link) {
  return Viva.Graph.svg('path').attr('stroke', 'grey')
}).placeLink(function(linkUI, fromPos, toPos) {
  var data = 'M' + fromPos.x + ',' + fromPos.y + 'L' + toPos.x + ',' + toPos.y;
  linkUI.attr("d", data);
})
*/

// change layout
layout = Viva.Graph.Layout.forceDirected(graph, {
  springLength: linkLength
});

renderGraph()

/* -----------------------------------------
            For custom appearance
----------------------------------------- */

// set the color of related links of a node
function highlightRelatedNodes(nodeId, isOn) {
  graph.forEachLinkedNode(nodeId, function(node, link) {
    let linkUI = graphics.getLinkUI(link.id);
    if (linkUI) {
      linkUI.attr('stroke', isOn ? 'red' : 'grey')
    }
  })
}

/* -----------------------------------------
        General graph manipulations
----------------------------------------- */

function renderGraph() {
  renderer = Viva.Graph.View.renderer(graph, {
    container: document.getElementById('vg'),
    graphics: graphics,
    layout: layout
  })
  renderer.run()
}

function checkNewNode(nodeId, attributes) {
  if (graph.getNode(nodeId)) {
    return   // already existing nodes must be assured to have all attributes
  }

  console.log(nodeId, attributes)

  return new Promise(function (resolve, reject) {
    let title = attributes === undefined ? nodeId : attributes.title
    let fileName = attributes === undefined || !existFile(attributes.pdf) ? requirePdf() : attributes.pdf
    resolve(fileName)
  }).then(function (fileName) {
    if (!existFile(nodeId + '.png')) {
      return generateThumbnail(fileName, nodeId)
    }
  }).then(function () {
    if (!existFile(nodeId + '.png')) {
      console.log("no png!")
    } else {
      console.log("png exists", fileName)
      graph.addNode(nodeId, {pdf: resolve(fileName), png: resolve(nodeId + '.png'), title: title})
    }
  })
}

function addElement(s, t) {   // TODO: textboxでadd -> remove, pngも削除 -> 再度addすると消したはずのpngのサムネイルが使われる現象を直す
  if (s === "") {
    return
  } else if (t === "") {
    checkNewNode(s)
  } else {
    if (!graph.getLink(s, t)) {
      checkNewNode(s)
      checkNewNode(t)
      graph.addLink(s, t)
    }
  }
}

function removeElement(s, t) {
  if (s === "") {
    return
  } else if (t === "") {
    graph.removeNode(s)
  } else {
    graph.removeLink(graph.getLink(s, t))
  }
}

function loadGraphFromJSON(json) {
  const edges_and_nodes = JSON.parse(fs.readFileSync(json, 'utf8'))
  const nodes = edges_and_nodes['nodes']
  const edges = edges_and_nodes['edges']

  Promise.all(nodes.map(function(node) {
    let id = node.id
    delete node.id
    return checkNewNode(id, node)
  }))
  .then(function() {
    for (let i = 0; i < edges.length; i++) {
      graph.addLink(edges[i].source, edges[i].target)
    }  
  })
}

function writeGraphToJSON(json) {
  let nodes = [], edges = []
  graph.forEachNode(function(node) {
    let obj = node.data
    obj.id = node.id
    nodes.push(obj)
  })
  graph.forEachLink(function(link) {
    edges.push({'source': link.fromId, 'target': link.toId})
  })
  fsExtra.writeJson(json, {'nodes': nodes, 'edges': edges})
}

/* -----------------------------------------
                    Menu
----------------------------------------- */

// "Open"
ipcRenderer.on('open', (event, json) => {
  graph.clear()
  loadGraphFromJSON(json)
  openingGraphFile = json
})

// "Save"
ipcRenderer.on('save', (event) => {
  writeGraphToJSON(openingGraphFile)
})

// "Save As..."
ipcRenderer.on('save-as', (event, json) => {
  writeGraphToJSON(json)
})

/* -----------------------------------------
                  Utilities
----------------------------------------- */

function monitorChangesOnGraph() {
  graph.on('changed', function(changes) {
    console.log(changes[0]);   // prints array of change records
  })
}

function existFile(fileName) {
  try {
    fs.statSync(fileName)
    return true
  } catch(err) {
    if(err.code === 'ENOENT') {
      return false
    }
  }
}

function requirePdf() {
  return dialog.showOpenDialog({   // synchronous
    filters: [{name: 'PDF', extensions: ['pdf']}]
  })[0]
}

function generateThumbnail(inPdfFileName, outPngPrefix) {
  //const prefix = fileName.match(/(.*)(?:\.([^.]+$))/)[1]

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
          console.log("generated")
          resolve()
        })
      })
    })
  })
}

function openPdf(fileName) {
  const win = new BrowserWindow({ width: 800, height: 1000 })
  PDFWindow.addSupport(win)
  win.loadURL("file://" + resolve(fileName))
}