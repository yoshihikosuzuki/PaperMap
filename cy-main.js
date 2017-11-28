const cytoscape = require('cytoscape')
const fs = require('fs');
const fsExtra = require('fs-extra');

module.exports = class graphCy {
  constructor(){
    this.graph_ = {}
  }

  get graph(){
    return this.graph_
  }

  set graph(json){
    let edges_and_nodes = JSON.parse(fs.readFileSync(json, 'utf8'))
    let graph = {elements: edges_and_nodes}
    this.graph_ = graph
  }
}

/*let graph = {}

exports.loadGraphFromJSON = (json) => {
  edges_and_nodes = JSON.parse(fs.readFileSync(json, 'utf8'))
  graph = {elements: edges_and_nodes}
  console.log(graph)
  return graph
}*/