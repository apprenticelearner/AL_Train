import c_Seshat from './js_glue';


class Seshat {
  constructor(buff_len = 2048){
    this.promise = c_Seshat().then((Module)=> {
      console.log("Module", Module); 

      var HEAPF64 = Module.HEAPF64;
      var HEAP32  = Module.HEAP32;

      
      this.input_ptr = Module._malloc((buff_len * 2)  * 
                           HEAPF64.BYTES_PER_ELEMENT);
      const input_ptr = this.input_ptr
      const input_buffer = new Float64Array(HEAPF64.buffer, input_ptr, (buff_len * 2))

      this.c_module = Module

      this.me_parser = new Module.meParser()
      this.recognize_symbol = (strokes)=>{
      	var inp = []
      	var n_strokes = strokes.length
      	for(var stroke of strokes){
      		inp.push(stroke.length)
      		for(var pt of stroke){
      			inp.push(pt[0]);
      			inp.push(pt[1]);
      		}
      	}
      	input_buffer.set(inp)
      	this.me_parser.recognize_symbol(input_ptr,n_strokes,10)
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
