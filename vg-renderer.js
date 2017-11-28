const {ipcRenderer} = require('electron')
const Viva = require('vivagraphjs')
const {getGraph} = require('electron').remote.require('./vg-main')

let renderer

// Remove getter/setter from an object (remotely imported objects include them)
// But it does not change the behavior of vivagraph's rendering
/*function removeGetSet(obj) {
  let newObj = {}
  for (let key in obj) {
    newObj[key] = obj[key]
  }
  newObj.prototype = obj.prototype
  return newObj
}*/

// "Open" via Menu
ipcRenderer.on('open', (event) => {
  // initialize graph
  if (typeof renderer !== 'undefined') {
    renderer.dispose()
  }

  // load a new graph
  graph = getGraph()
  //newGraph = removeGetSet(graph)
  
  // render the graph
  renderer = Viva.Graph.View.renderer(graph, {
    container: document.getElementById('vg'),
    graphics: Viva.Graph.View.svgGraphics()
    //graphics: Viva.Graph.View.webglGraphics()   // draw using WebGL
  })
  renderer.run()
})