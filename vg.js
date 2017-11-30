const {ipcRenderer} = require('electron')
const fs = require('fs')
const fsExtra = require('fs-extra')
const im = require('gm').subClass({imageMagick: true})
const Viva = require('vivagraphjs')

let openingFile = ""
let graph = Viva.Graph.graph()
let graphics = Viva.Graph.View.svgGraphics()
let layout
let renderer

monitorChangesOnGraph()

/* -----------------------------------------
          Miscellaneous utilities
----------------------------------------- */

function monitorChangesOnGraph() {
  graph.on('changed', function(changes) {
    console.log(changes[0]);   // prints array of change records
  })
}

function generateThumbnail(fileName) {
  const prefix = fileName.match(/(.*)(?:\.([^.]+$))/)[1]
  im(fileName + "[0]").setFormat('png')
                      .resize(400, 400)
                      .background('white')
                      .flatten()
                      .write(prefix + '.png', function(err) {console.log(err)})
}

/*
const inkscape = require('inkscape')
const pdfToSvgConverter = new inkscape(['--export-plain-svg', '--export-width=128'])

function convertPdfToSvg(fileName) {
  const prefix = fileName.match(/(.*)(?:\.([^.]+$))/)[1]  
  fs.createReadStream(fileName).pipe(pdfToSvgConverter).pipe(fs.createWriteStream(prefix + '.svg'))
}
*/

/* -----------------------------------------
        PaperMap-specific appearance
----------------------------------------- */

let nodeSize = 100
let linkLength = 200

graph.addNode('anvaka', 'hoge.png')   // relative path or absolute path starting with file:///
graph.addNode('indexzero', 'huga.png')
graph.addLink('anvaka', 'indexzero')

// set custom node appearance
graphics.node(function(node) {
  // The function is called every time renderer needs a ui to display node
  let ui = Viva.Graph.svg('g')
  let svgText = Viva.Graph.svg('txt').attr('y', '-4px').text(node.id)
  //let rect = Viva.Graph.svg('rect').attr('width', nodeSize).attr('height', nodeSize).attr('style', 'fill:rgb(255,255,255)')   // background
  let img = Viva.Graph.svg('image')
            .attr('width', nodeSize)
            .attr('height', nodeSize)
            .link(node.data)   // => <image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=node.data></image>
  ui.append(svgText)
  //ui.append(rect)
  ui.append(img)
  $(ui).hover(function() {   // mouse over
    highlightRelatedNodes(node.id, true)
  }, function() {   // mouse out
    highlightRelatedNodes(node.id, false)
  })
  return ui
}).placeNode(function(nodeUI, pos) {
  nodeUI.attr('transform',
              'translate(' + (pos.x - nodeSize/2) + ',' + (pos.y - nodeSize/2) + ')')
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

// set the color of related links of the node
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
  if (renderer !== undefined) {
    graph.beginUpdate()
  }
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
  if (renderer !== undefined) {
    graph.endUpdate()
  } else {
    renderGraph()
  }
}

function removeElement(s, t) {
  if (renderer === undefined) {
    return
  }
  graph.beginUpdate()
  if (s === "") {
    return
  } else if (t === "") {
    graph.removeNode(s)
  } else {
    graph.removeLink(graph.getLink(s, t))
  }
  graph.endUpdate()
}

function loadGraphFromJSON(json) {
  const edges_and_nodes = JSON.parse(fs.readFileSync(json, 'utf8'))
  const nodes = edges_and_nodes['nodes']
  const edges = edges_and_nodes['edges']

  for (var i = 0; i < nodes.length; i++) {
    graph.addNode(nodes[i]['data']['id'])
  }
  for (var i = 0; i < edges.length; i++) {
    graph.addLink(edges[i]['data']['source'], edges[i]['data']['target'], edges[i]['data']['id'])
  }
}

// "Open" via Menu
ipcRenderer.on('open', (event, jsons) => {
  if (renderer !== undefined) {
    renderer.dispose()
  }
  graph.clear()
  loadGraphFromJSON(json)
  renderGraph()
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
