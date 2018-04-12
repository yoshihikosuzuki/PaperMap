const fs = require('fs')
const fsExtra = require('fs-extra')
const resolve = require('path').resolve
const Viva = require('vivagraphjs')

const {
  renderGraph,
  monitorChangesOnGraph,
  highlightRelatedNodes,
  checkNewNode,
  addElement,
  removeElement
} = require('./src/renderer/graph-manipulation')

const {
  openPdf
} = require('./src/renderer/utils')

// Monitor graph IO using dialog
let openingGraphFile = ""
require('./src/renderer/graph-io')


let graph = Viva.Graph.graph()
let graphics = Viva.Graph.View.svgGraphics()
let layout
let renderer

monitorChangesOnGraph()


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
  $(ui).hover(function() {   // mouse overs
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

// change layout
layout = Viva.Graph.Layout.forceDirected(graph, {
  springLength: linkLength
});

renderGraph()
