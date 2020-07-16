import c_BezierFit from './build/js_glue';


class BezierFit {
  constructor(max_stroke_length = 512){
    this.promise = c_BezierFit().then((Module)=> {
      console.log("Module", Module); 

      var HEAPF64 = Module.HEAPF64;
      var HEAP32  = Module.HEAP32;

      
      this.input_ptr = Module._malloc((max_stroke_length * 2)  * 
                           HEAPF64.BYTES_PER_ELEMENT);
      const input_ptr = this.input_ptr

      
      this.output_ptr = Module._malloc((max_stroke_length * 2)  * 
                           HEAPF64.BYTES_PER_ELEMENT);
      const output_ptr = this.output_ptr

      
      this.ml_ptr = Module._malloc((max_stroke_length * 9)  * 
                           HEAPF64.BYTES_PER_ELEMENT);
      const ml_ptr = this.ml_ptr

      const input_buffer = new Float64Array(HEAPF64.buffer, input_ptr, max_stroke_length * 2)
      const output_buffer = new Float64Array(HEAPF64.buffer, output_ptr, max_stroke_length * 2)
      const ml_buffer = new Float64Array(HEAPF64.buffer, ml_ptr, max_stroke_length * 9)


      this.c_module = Module
      this.fitCurve = (points,error=6.0) => {
        points = points.flat()
        var nPts = points.length / 2
        input_buffer.set(points.flat())
        var n_curves = Module._c_FitCurve(input_ptr,nPts,error*error,output_ptr)
        Module._c_ML_EncodeCurves(output_ptr,n_curves,ml_ptr);
        // Module._c_InflectionPoints(input_ptr,nPts)
        var out = []
        var it = output_buffer.entries()
        const nxt = () => Math.round(it.next().value[1])
        for (var i=0; i < n_curves; i++){
          out[i] = [nxt(),nxt(),nxt(),nxt(),nxt(),nxt(),nxt(),nxt()]
          // console.log("Bezier: ", i, out[i])
        }
        return out;
      }

      this.fitCurveFeatures = (points,error=6.0) => {
        points = points.flat()
        var nPts = points.length / 2
        input_buffer.set(points.flat())
        var n_curves = Module._c_FitCurve(input_ptr,nPts,error*error,output_ptr)
        Module._c_ML_EncodeCurves(output_ptr,n_curves,ml_ptr);
        // Module._c_InflectionPoints(input_ptr,nPts)
        var out = []
        var it = ml_buffer.entries()
        const nxt = () => it.next().value[1]
        for (var i=0; i < n_curves; i++){
          out[i] = [nxt(),nxt(),nxt(),nxt(),nxt(),nxt(),nxt(),nxt(),nxt()]
          // console.log("Bezier: ", i, out[i])
        }
        return out;

      }

      this.groupStrokes = (strokes) => {
        strokes = Object.values(strokes)
        const len_ptr = Module._malloc(strokes.length*HEAP32.BYTES_PER_ELEMENT);
        const len_buffer = new Int32Array(HEAP32.buffer, len_ptr, strokes.length);
        // var total = 0;
        var lens = [];
        var points = [];
        for(var i=0;i < strokes.length;i++){
          var stroke =strokes[i];
          // total += stroke.points.length;
          lens.push(stroke.points.length);
          points = points.concat(stroke.points);
        } 
        // console.log(points,lens, strokes.length)
        len_buffer.set(lens);
        const stroke_ptr = Module._malloc(2*points.length*HEAPF64.BYTES_PER_ELEMENT);
        const stroke_buffer = new Float64Array(HEAPF64.buffer, stroke_ptr, points.length*2); 
        stroke_buffer.set(points.flat())

        const out_ptr = Module._malloc(2*strokes.length*HEAP32.BYTES_PER_ELEMENT);
        const out_buffer = new Int32Array(HEAP32.buffer, out_ptr, 2*strokes.length); 
        var nGroups = Module._c_GroupStrokes(stroke_ptr,len_ptr,strokes.length,out_ptr,.1,.5,50.0);
        // console.log("NGRPS",nGroups,strokes.length)
        var out = [];
        var it = out_buffer.entries()
        const nxt = () => it.next().value[1]
        for(var i=0;i < nGroups;i++){
          var L = nxt();
          var grp = [];
          for(var j=0;j < L;j++){
            grp.push(strokes[nxt()].id)
          }
          out.push(grp);
        }
        // console.log("OUT", out)

        Module._free(stroke_ptr);
        Module._free(len_ptr);
        Module._free(out_ptr);
        return out;
        // const len_ptr = Module._malloc(2*total*HEAPF64.BYTES_PER_ELEMENT);
        // input_buffer.set(points.flat())
        // var n_curves = Module._c_FitCurve(input_ptr,nPts,error*error,output_ptr)
        // Module._c_ML_EncodeCurves(output_ptr,n_curves,ml_ptr);
        // Module._c_InflectionPoints(input_ptr,nPts)
        // var out = []
        // var it = output_buffer.entries()
        // const nxt = () => Math.round(it.next().value[1])
        // for (var i=0; i < n_curves; i++){
        //   out[i] = [nxt(),nxt(),nxt(),nxt(),nxt(),nxt(),nxt(),nxt()]
        //   // console.log("Bezier: ", i, out[i])
        // }
        // console.log(out)
        // return out
      }
    });
  }
}

export default BezierFit;
// const BezierFit = (function () => {
//   var promise = new Promise((resolve,reject) => {
//     var JS_Module = {}
//     c_BezierFit().then(function(Module) {
//       console.log("Module", Module); 

//       var HEAPF64 = Module.HEAPF64;

//       const input_ptr = Module._malloc(1024 * 
//                            HEAPF64.BYTES_PER_ELEMENT); // 1

//       const output_ptr = Module._malloc(1024 * 
//                            HEAPF64.BYTES_PER_ELEMENT); // 1

//       const input_buffer = new Float64Array(HEAPF64.buffer,input_ptr,1024)
//       const output_buffer = new Float64Array(HEAPF64.buffer,output_ptr,1024)

//       JS_Module.c_module = Module
//       JS_Module.FitCurve = (points) => {
//         input_buffer.set(points)
//         var n_curves = Module._c_FitCurve(input_ptr,3,4.0,output_ptr)
//         var out = []
//         var it = output_buffer.entries()
//         const nxt = () => it.next().value[1]
//         for (var i=0; i < n_curves; i++){
//           out[i] = [nxt(),nxt(),nxt(),nxt(),nxt(),nxt(),nxt(),nxt()]
//           console.log("Bezier: ", i, out[i])
//         }
//         console.log(out)
//         return out
//       }
//       // sumUp([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
//      resolve(JS_Module)
//     });
//   })
//   return promise
// });
// export default BezierFit;