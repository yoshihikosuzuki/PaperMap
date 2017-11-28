const {ipcRenderer} = require('electron')
const cytoscape = require('cytoscape')
const graphCy = require('electron').remote.require('./cy-main')

let cy = cytoscape({
  container: document.getElementById('cy'),
});

ipcRenderer.on('open', (event, json) => {
  let graphObj = new graphCy()
  graphObj.graph = json
  graph = graphObj.graph

  //console.log(graph)
  cy.json(graph);   // convert JSON to graph

  cy.layout({name: 'circle'}).run();   // NOTE: no need for the first rendering?
})