const {ipcRenderer} = require('electron')
const fs = require('fs')
const fsExtra = require('fs-extra')
const pdf = require('pdfjs-dist-for-node')
const {BrowserWindow} = require('electron').remote
const PDFWindow = require('electron-pdf-window')
const resolve = require('path').resolve
const Viva = require('vivagraphjs')

let openingFile = ""
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
            .link(node.id + '.png')   // => <image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=node.id></image>
  ui.append(svgText)
  ui.append(img)
  $(ui).hover(function() {   // mouse over
    highlightRelatedNodes(node.id, true)
  }, function() {   // mouse out
    highlightRelatedNodes(node.id, false)
  })
  ui.addEventListener('click', function() {
    openPdf(node.data.pdf)
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
    var linkUI = graphics.getLinkUI(link.id);
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

function addElement(s, t) {
  if (s === "") {
    return
  } else if (t === "") {
    if (graph.getNode(t) === undefined) {
      graph.addNode(s)
    }
  } else {
    if (!graph.getLink(s, t)) {
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

  for (var i = 0; i < nodes.length; i++) {
    graph.addNode(nodes[i]['data']['id'], {pdf: nodes[i]['pdf']})   // TODO: change so that all attributions are loaded
  }
  for (var i = 0; i < edges.length; i++) {
    graph.addLink(edges[i]['data']['source'], edges[i]['data']['target'], edges[i]['data']['id'])
  }
}

// "Open" via Menu
ipcRenderer.on('open', (event, json) => {
  graph.clear()
  loadGraphFromJSON(json)
  openingFile = json
})

function writeGraphToJSON(json) {
  let nodes = [], edges = []
  graph.forEachNode(function(node) {
    nodes.push({'data': {'id': node.id}})
  })
  graph.forEachLink(function(link) {
    edges.push({'data': {'id': link.data, 'source': link.fromId, 'target': link.toId}})
  })
  fsExtra.writeJson(json, {'nodes': nodes, 'edges': edges})
}

// "Save" via Menu
ipcRenderer.on('save', (event) => {
  writeGraphToJSON(openingFile)
})

// "Save As..." via Menu
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

function generateThumbnail(fileName) {
  const prefix = fileName.match(/(.*)(?:\.([^.]+$))/)[1]

  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')

  pdf.getDocument(fileName).then(function (doc) {
    doc.getPage(1).then(function (page) {
      let viewport = page.getViewport(1.0)
      canvas.height = viewport.height
      canvas.width = viewport.width
      let renderer = {
        canvasContext: ctx,
        viewport: viewport
      }
      page.render(renderer).then(function () {
        ctx.globalCompositeOperation = 'destination-over'
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        let image = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
        fs.writeFile(prefix + '.png', image, 'base64', function(err) {
          if (err) {
            console.log("[ERROR] Failed to write png.")
          }
        })
      })
    })
  })
}

/*
const inkscape = require('inkscape')
const pdfToSvgConverter = new inkscape(['--export-plain-svg', '--export-width=128'])

function convertPdfToSvg(fileName) {
  const prefix = fileName.match(/(.*)(?:\.([^.]+$))/)[1]  
  fs.createReadStream(fileName).pipe(pdfToSvgConverter).pipe(fs.createWriteStream(prefix + '.svg'))
}
*/

function openPdf(fileName) {
  const win = new BrowserWindow({ width: 800, height: 1000 })
  PDFWindow.addSupport(win)
  win.loadURL("file://" + resolve(fileName))
}
