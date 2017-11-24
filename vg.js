var Viva = require('vivagraphjs');

var graph = Viva.Graph.graph();
graph.addLink(1, 2);

var graphics = Viva.Graph.View.svgGraphics();
//var graphics = Viva.Graph.View.webglGraphics();   // draw using WebGL

var renderer = Viva.Graph.View.renderer(graph, {
  container: document.getElementById('vg'),
  graphics : graphics
});
renderer.run();
