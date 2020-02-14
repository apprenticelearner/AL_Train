import {Random} from "random-js"
import papa from "papaparse"
const random = new Random()


export var registedFunctions = {
	"concatenate" : concatenate,
	"shuffle" : shuffle,
	"sample" : sample,
	"glob" : glob,
	"from_file" : from_file,
	"estimate_Pik" : estimate_Pik,
}

async function concatenate(args, context){
	var all = []
	for(var g of args){
		var rez = await evalJSONFunc(g,context)
		all = all.concat(rez)
	}
	return all
}

async function shuffle(args,context){
	var rez = await evalJSONFunc(args,context)
	return random.shuffle(rez)
}

async function sample(args,context){
	var n = args['n']
	//TODO: Implement -> var w_repl = val['with_replacement'] || false
	var set = args['set']
	set = await evalJSONFunc(set,context)
	console.log("IT IS THIS BIG:", set.length)
	return random.sample(set, n)
}

async function glob(args,context){
	var glob_key = args['key']
	var pattern = args['pattern']
	var matches = await context.network_layer.glob(pattern,context)
	matches = matches.map(m => {var o = {}; o[glob_key]="/"+m; return o})
	return matches
}

async function from_file(args,context){
	throw "Not Implemented"
}


//------------------PRIOR KNOWLEDGE STUFF------------------------

async function backcast(args,context){

}

function p_parse_csv(csv,config={},from_file=false){
	var promise = new Promise(async function(resolve, reject) {
		config['complete'] = resolve
		if(from_file){
			csv = await fetch(csv).then(resp => resp.text())
		}
		papa.parse(csv, config)
	})
	return promise
}

async function read_afm_table(file){
	// var promise = new Promise(async function(resolve, reject) {
	var config = {
		delimiter: "\t",
		header: true,
		dynamicTyping: true
	}
	var promise = fetch(file)
	.then(resp => resp.text())
	.then((text) => {
		var split = text.split(/\n{2,}/g);
		var kc_table = split[0].split(/Values for .* model.*\n/)[1]
		var student_table = split[1].split("in the selected KC model.\n")[1]
		console.log("split")
		console.log(split)
		console.log(kc_table)
		console.log(student_table)
		return [kc_table,student_table]
	})
	.then(async ([kc_table,stu_table]) => {
		var kc_json = await p_parse_csv(kc_table, config)
		var stu_json = await p_parse_csv(stu_table, config)
		return [kc_json,stu_json]
	})
    return promise
}

async function exact_align(args,context){
	var fo_err_by_kc
	if(args['fo_err_by_kc'] == null){
		// console.log("afm_stats")
		var [kc_json,stu_json] = await read_afm_table(context.working_dir + "/" + args['afm_stats'])
		// console.log(stu_json)
		var stu_intr = stu_json.data.filter((x)=> x["Anon Student Id"] == args['student_id'])[0]["Intercept"]

		fo_err_by_kc = {}
		for(var row of kc_json.data){
			var prob = 1.0/(1.0+Math.exp((stu_intr + row['Intercept (logit)'])))
			fo_err_by_kc[row['KC Name']] = prob
		}
		// console.log(fo_err_by_kc)
	}
	fo_err_by_kc = fo_err_by_kc || args['fo_err_by_kc']

	var table_path = context.working_dir + "/" +args['error_table']
	// console.log("table_path")
	// console.log(table_path)
	var error_table = await p_parse_csv(table_path, { delimiter: "\t",header: true, dynamicTyping: true},true)
	// console.log("error_table")
	// console.log(error_table)
	var curve_by_kc = {}
	 for (var r of error_table.data){
		var key = r["KC Name"]
		if(key){
			delete r["KC Name"]
			curve_by_kc[key] = Object.values(r)
		}
	}
	// console.log("curve_by_kc")
	// console.log(curve_by_kc)
	var opp_by_kc = {}
	for(var kc in curve_by_kc){
		var curve = curve_by_kc[kc]
		var min = Infinity;
		var minIndex;
		var y = fo_err_by_kc[kc]

		for(const [i,x] of curve.entries()){
			var diff = Math.abs(x-y)
			if(diff < min){
				min = diff
				minIndex = i
			}
		}
		opp_by_kc[kc] = minIndex
	}

	console.log("opp_by_kc")
	console.log(opp_by_kc)
	return opp_by_kc
	
}

async function estimate_Pik(args,context){
	console.log("ESTIMATE_PIK")
	if(args['method'] == "exact_align"){
		return await exact_align(args,context)
	}else if(args['method'] == "backcast"){
		return await backcast(args,context)
	}
}

async function prebake(args,context){
	var opp_by_kc = evalJSONFunc(args['opportunities'],context)
	var kc_pivot_table = await p_parse_csv(kc_pivot_table,
		{ delimiter: "\t",header: true, dynamicTyping: true},true)
	var model = args['kc_model_name']
	console.log(kc_pivot_table)
	//TO DO: HERE
}

export async function evalString(){
	throw "Not Implemented"
}

export async function evalJSONFunc(spec, context){
	// var promise = new Promise(async (resolve,reject) => {
	if(Array.isArray(spec)){
		return [...spec]
	}else if(typeof(spec) === 'object'){
		spec = {...spec};

		var key = Object.keys(spec)[0];
		var val = spec[key]
		if(key in registedFunctions){
			return await registedFunctions[key](val,context)
		}else{	
			return spec
		}
	}else{
		return spec
	}
	// })
	// return promise
}

// export async function evalFunc(name,args,context){
// 	if(name in registedFunctions){
// 		return await registedFunctions[name](args,context)
// 	}else{	
// 		throw "Function " + name + " is not a registed function."
// 	}
// }