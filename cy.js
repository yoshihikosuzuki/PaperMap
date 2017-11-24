var cytoscape = require('cytoscape');
var fs = require('fs');
var fsExtra = require('fs-extra');

var cy = cytoscape({
  container: document.getElementById('cy'),
  /*elements: [
    {data: {id: 'a'}},
    {data: {id: 'b'}},
    {data: {id: 'ab', source: 'a', target: 'b'}}
  ]*/
});

//fsExtra.writeJson('graph.json', cy.json()['elements']);   // output graph as JSON

edges_and_nodes = JSON.parse(fs.readFileSync('graph.json', 'utf8'));
//console.log(edges_and_nodes);

cy.json({elements: edges_and_nodes});   // convert JSON to graph

cy.layout({name: 'circle'}).run();   // NOTE: no need for the first rendering?