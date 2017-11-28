const fs = require('fs')
const fsExtra = require('fs-extra')
const Viva = require('vivagraphjs')

let graph = Viva.Graph.graph()

exports.getGraph = () => {   // TODO: making a class or an object like a class is better?
  return graph
}

exports.loadGraphFromJSON = (json) => {
  graph.clear()

  const edges_and_nodes = JSON.parse(fs.readFileSync(json, 'utf8'))
  const nodes = edges_and_nodes['nodes']
  const edges = edges_and_nodes['edges']

  for (var i = 0; i < nodes.length; i++) {
    graph.addNode(nodes[i]['data']['id'])
  }
  for (var i = 0; i < edges.length; i++) {
    graph.addLink(edges[i]['data']['source'], edges[i]['data']['target'], edges[i]['data']['id'])
  }
  //console.log(graph)
  //return graph
}

exports.writeGraphToJSON = (json) => {
  let nodes = [], edges = []
  graph.forEachNode(function(node) {
    nodes.push({'data': {'id': node.id}})
  })
  graph.forEachLink(function(link) {
    edges.push({'data': {'id': link.data, 'source': link.fromId, 'target': link.toId}})
  })
  fsExtra.writeJson(json, {'nodes': nodes, 'edges': edges})
}