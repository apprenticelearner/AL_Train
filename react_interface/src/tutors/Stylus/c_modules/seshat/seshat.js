import c_Seshat from './js_glue';


class Seshat {
  constructor(in_buff_len = 2048, out_buff_len = 128, n_out_classes = 10){
    const NC = n_out_classes;
    this.promise = c_Seshat().then((Module)=> {
      console.log("Module", Module); 

      var HEAPF64 = Module.HEAPF64;
      var HEAP32  = Module.HEAP32;
      var HEAPF32  = Module.HEAPF32;

      
      this.input_ptr = Module._malloc((in_buff_len * 2)  * 
                           HEAPF64.BYTES_PER_ELEMENT);
      this.class_ptr = Module._malloc((out_buff_len * NC)  * 
                           HEAP32.BYTES_PER_ELEMENT);
      this.prob_ptr = Module._malloc((out_buff_len * NC)  * 
                           HEAPF32.BYTES_PER_ELEMENT);

      const input_ptr = this.input_ptr
      const class_ptr = this.class_ptr
      const prob_ptr = this.prob_ptr
      const input_buffer = new Float64Array(HEAPF64.buffer, input_ptr, (in_buff_len * 2))
      const class_buffer = new Int32Array(HEAP32.buffer, class_ptr, (out_buff_len * NC))
      const prob_buffer = new Float32Array(HEAPF32.buffer, prob_ptr, (out_buff_len * NC))

      this.c_module = Module

      this.me_parser = new Module.meParser()
      this.sym_strings = this.me_parser.getSymbolStrings();
      this.recognize_symbol = (strokes)=>{
      	var inp = []
      	var n_strokes = strokes.length
      	for(var stroke of strokes){
          if(typeof stroke === 'object' && stroke != null){
            stroke = stroke.points
          } 
          if(stroke == undefined) continue;
      		inp.push(stroke.length)
      		for(var pt of stroke){
            // console.log(pt)
      			inp.push(pt[0]);
      			inp.push(pt[1]);
      		}
      	}
        // console.log(inp)
        var out = {}
        if(inp.length > 0){
        	input_buffer.set(inp)
        	this.me_parser.recognize_symbol(input_ptr,n_strokes,NC,class_ptr,prob_ptr);

          var itc = class_buffer.entries()
          var itp = prob_buffer.entries()
          const nxt = () => [itc.next().value[1],itp.next().value[1]]
          
          for(var i=0; i < NC; i++){
            
            var [c,p] = nxt()
            out[this.sym_strings.get(c)] = p
            // if(c && p){
            // console.log(this.sym_strings.get(c),p)
            // }
          }
        }
        return out
      }

    })
      
  }
}

// async function go(){
// 	var seshat = await new Seshat();
// 	seshat.recognize_symbol([
// 							[
// 							[200,200],
// 							[210,210],
// 							[220,220],
// 							[230,230],
// 							[240,240],
// 							[250,250],
// 							],
// 							[
// 							[200,200],
// 							[210,210],
// 							[220,220],
// 							[230,230],
// 							[240,240],
// 							[250,250],
// 							],
// 							])
//   console.log("I HAVE COMPLETED")
// }

// go();


export default Seshat;
