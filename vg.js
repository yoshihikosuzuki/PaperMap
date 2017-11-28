const {ipcRenderer} = require('electron')
const fs = require('fs')
const fsExtra = require('fs-extra')
const Viva = require('vivagraphjs')

let fileName = ""
let graph = Viva.Graph.graph()
let renderer

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
  // initialize graph
  if (typeof renderer !== 'undefined') {
    renderer.dispose()
  }
  graph.clear()

  // load a new graph
  graph.beginUpdate()
  loadGraphFromJSON(jsons[0])
  graph.endUpdate()

  // render the graph
  renderer = Viva.Graph.View.renderer(graph, {
    container: document.getElementById('vg'),
    graphics: Viva.Graph.View.svgGraphics()
    //graphics: Viva.Graph.View.webglGraphics()   // draw using WebGL
  })
  renderer.run()

  fileName = jsons[0]
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
  writeGraphToJSON(fileName)
})

// "Save As..." via Menu
ipcRenderer.on('save-as', (event, json) => {
  writeGraphToJSON(json)
})