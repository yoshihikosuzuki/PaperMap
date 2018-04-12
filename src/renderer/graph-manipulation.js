const {
  existFile,
  requirePdf,
  generateThumbnail
} = require('./utils')

module.exports.renderGraph = function renderGraph() {
  renderer = Viva.Graph.View.renderer(graph, {
    container: document.getElementById('vg'),
    graphics: graphics,
    layout: layout
  })
  renderer.run()
}

module.exports.monitorChangesOnGraph = function monitorChangesOnGraph() {
  graph.on('changed', function(changes) {
    console.log(changes[0]);   // prints array of change records
  })
}

// Set the color of related links of a node
// For now, this is used for a node on which cursor exists
module.exports.highlightRelatedNodes = function highlightRelatedNodes(nodeId, isOn) {
  graph.forEachLinkedNode(nodeId, function(node, link) {
    let linkUI = graphics.getLinkUI(link.id);
    if (linkUI) {
      linkUI.attr('stroke', isOn ? 'red' : 'grey')
    }
  })
}

// First check if the specified node already exists or not
// If not, prepare title, path of pdf, and path of png of the node
// and add the node into the current graph
module.exports.checkNewNode = function checkNewNode(nodeId, attributes) {
  if (graph.getNode(nodeId)) {
    return   // already existing nodes must be assured to have all attributes
  }

  let title, fileName
  return new Promise(function (resolve, reject) {
    title = attributes === undefined ? nodeId : attributes.title
    fileName = attributes === undefined || !existFile(attributes.pdf) ? requirePdf() : attributes.pdf
    resolve(fileName)
  }).then(function (fileName) {
    if (!existFile(nodeId + '.png')) {
      return generateThumbnail(fileName, nodeId)
    }
  }).then(function () {
    graph.addNode(nodeId, {pdf: resolve(fileName), png: resolve(nodeId + '.png'), title: title})
  })
}

// For now, addElement and removeElement are used only for manipulation via textbox
// TODO: textboxでadd -> remove, pngも削除 -> 再度addすると消したはずのpngのサムネイルが使われる現象を直す
module.exports.addElement = function addElement(s, t) {
  if (s === "") {
    return
  } else if (t === "") {
    checkNewNode(s)
  } else {
    if (!graph.getLink(s, t)) {
      checkNewNode(s)
      checkNewNode(t)
      graph.addLink(s, t)
    }
  }
}

module.exports.removeElement = function removeElement(s, t) {
  if (s === "") {
    return
  } else if (t === "") {
    graph.removeNode(s)
  } else {
    graph.removeLink(graph.getLink(s, t))
  }
}