// Handle with graph IO using dialogs

const {remote, ipcRenderer} = require('electron')
const {dialog} = remote
const {checkNewNode} = require('./graph-manipulation')

function loadGraphFromJSON(jsonFname) {
  const edges_and_nodes = JSON.parse(fs.readFileSync(jsonFname, 'utf8'))
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

function writeGraphToJSON(jsonFname) {
  let nodes = [], edges = []
  graph.forEachNode(function(node) {
    let obj = node.data
    obj.id = node.id
    nodes.push(obj)
  })
  graph.forEachLink(function(link) {
    edges.push({'source': link.fromId, 'target': link.toId})
  })
  fsExtra.writeJson(jsonFname, {'nodes': nodes, 'edges': edges})
}

function openGraph() {
  const jsonFname = dialog.showOpenDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })[0]

  graph.clear()
  loadGraphFromJSON(jsonFname)
  openingGraphFile = jsonFname
}

function saveGraph() {
  if (openingGraphFile === "") {
    saveFileAs()
  } else {
    writeGraphToJSON(openingGraphFile)
  }
}

function saveGraphAs() {
  const jsonFname = dialog.showSaveDialog({
    filters: [{name: 'JSON', extensions: ['json']}]
  })
  writeGraphToJSON(jsonFname)
  openingGraphFile = jsonFname
}

ipcRenderer.on('open', (event) => {openGraph()})
ipcRenderer.on('save', (event) => {saveGraph()})
ipcRenderer.on('save-as', (event) => {saveGraphAs()})