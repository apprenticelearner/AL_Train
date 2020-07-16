import * as tf from '@tensorflow/tfjs';
import {setWasmPath} from '@tensorflow/tfjs-backend-wasm';
import BezierFit from './c_modules/bezier_fit/bezier_fit'


const model_json = '/dist/danny_modeljs/model.json'

var model_url = 'https://raw.githubusercontent.com/khluu/smartsheet/master/tfjs/model-4.json'

const alphabet = ['!' ,'(' ,')', '+', ',', '-', '.', '/', '0', '1', '2', '3' ,'4', '5', '6', '7', '8', '9',
'=' ,'A', 'B', 'C', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'P', 'R', 'S', 'T' ,'V', 'X',
'Y', '[', '\\Delta' ,'\\alpha', '\\beta', '\\cos', '\\div', '\\exists',
'\\forall', '\\gamma', '\\geq', '\\gt' ,'\\in', '\\infty', '\\int', '\\lambda',
'\\ldots', '\\leq' ,'\\lim', '\\log' ,'\\lt', '\\mu', '\\neq', '\\phi', '\\pi',
'\\pm', '\\prime' ,'\\rightarrow' ,'\\sigma', '\\sin', '\\sqrt', '\\sum',
'\\tan', '\\theta' ,'\\times', '\\{', '\\}', ']', 'a', 'b', 'c', 'd', 'e', 'f', 'g',
'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y',
'z', '|']

function argsort(arr,k=0){
  var sorted = arr.map(((val,index) => [val,index])).sort((a,b) => a[0]-b[0]) 
  if(k){sorted = sorted.slice(0,k)}
  var vals = sorted.map(x => x[0])
  var indicies = sorted.map(x => x[1])
  return [vals, indicies]
}


export default class StrokeClassifier {
  constructor(){
    setWasmPath("/dist/tfjs-backend-wasm.wasm")
    var tf_promise = tf.setBackend('wasm');

    this.BezierFit = new BezierFit();
    this.BezierFit.promise.then(() => {
      this.fitCurve = this.BezierFit.fitCurve
      this.fitCurveFeatures = this.BezierFit.fitCurveFeatures
      this.groupStrokes = this.BezierFit.groupStrokes
      // this.fitCurve([[1,2],[3,4],[5,6],[7,8]])
    })
    
    this.promise = Promise.all([tf_promise, this.BezierFit.promise, this.model_promise]).then(async () => {
      this.model_promise = await tf.loadLayersModel(model_json).then((model) => {
      this.model = model
      })
    }).then(() => {
    // this.promise = Promise.all([ this.BezierFit.promise, this.model_promise]).then(() => {

      this.normalize_strokes = (strokes) => {
        console.log("STROKES", strokes)
        var minx = 2400000000, miny = 2400000000;
        var maxx = -2400000000, maxy = -2400000000;
        for (var i = 0; i < strokes.length; i++) {
          for (var j = 0; j < strokes[i].length; j++) {
              minx = Math.min(minx, strokes[i][j][0]);
              miny = Math.min(miny, strokes[i][j][1]);
          }
        }
        console.log(minx, maxx, miny, maxy);
        for (var i = 0; i < strokes.length; i++) {
          for (var j = 0; j < strokes[i].length; j++) {
              strokes[i][j][0] -= minx;
              strokes[i][j][1] -= miny;
              maxx = Math.max(maxx, strokes[i][j][0]);
              maxy = Math.max(maxy, strokes[i][j][1]);
          }
        }
        for (var i = 0; i < strokes.length; i++) {
          for (var j = 0; j < strokes[i].length; j++) {
              strokes[i][j][0] /= Math.min(maxx, maxy) / 100;
              strokes[i][j][1] /= Math.min(maxx, maxy) / 100;
          }
        }
        return strokes
      }

      this.recognize_symbol = (strokes) => {
        var inp = []
        var n_strokes = strokes.length
        for(var stroke of strokes){
          if(typeof stroke === 'object' && stroke != null){
            inp.push(stroke.points)
          } 
        }
        // inp = this.normalize_strokes(inp)
        console.log("normed",inp)
        var curve_features = []
        for(var stroke of inp){
          var curves = this.fitCurve(stroke)  
          for(var feats of this.fitCurveFeatures(stroke)){
            curve_features.push(feats)
          }
        }
        var input = tf.tensor([curve_features], DocumentType=tf.float32);
        // console.log(this.model)
        // console.log(curves)
        // console.log(curve_features)
        var s = this.model.predict(input).array().then((res) => {
          var [probs, indicies] = argsort(res[0],10)
          // console.log("probs",probs)
          // console.log("indicies",indicies)
          var out = {}
          for(var i=0; i < probs.length; i++){
            out[alphabet[indicies[i]]] = probs[i];
          }
          // console.log("OUT",out)
          return out
          
        });

        return s
        
        
        
        
      }


    })
  }

  

  
}


// var output = '';
// async function run(traces) {
//     //console.log('model loaded');
//     //console.log(model.getWeights()[0].print());
//     //console.log(a[0]);
    
    
//     var fit = new BezierFit(512, traces);
//     //console.log(fit);
//     var res = await fit.promise.then();
//     var input=[];
//     input.push(res[0]);
//     var i = 1;
//     for (i=1; i < res.length; i++) {
//       //console.log([res[i]]);
//       input.push(res[i]);
//     }
//     var ten = tf.tensor([input], DocumentType=tf.float32);
//     var s = model.predict(ten);
//     