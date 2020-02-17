import {Random} from "random-js"
import papa from "papaparse"
import path from "path"
const random = new Random()


export var registedFunctions = {
	"concatenate" : concatenate,
	"shuffle" : shuffle,
	"sample" : sample,
	"glob" : glob,
	"from_file" : from_file,
	"estimate_Pik" : estimate_Pik,
	"gen_pretraining" : gen_pretraining,
	'gen_pivot_table' : gen_pivot_table
}

function abs_path(p,context){
	if(p[0] != "/"){
		p = context.working_dir + "/" + p
	}
	return p
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
	if(typeof(args) == 'string'){
		args = {'pattern' : args}
	}
	var glob_key = args['key'] || null
	var pattern = args['pattern']
	var matches = await context.network_layer.glob(pattern,context)
	if(glob_key){
		matches = matches.map(m => {var o = {}; o[glob_key]="/"+m; return o})	
	}else{
		matches = matches.map(m => "/"+m)
	}
	return matches
}

async function from_file(args,context){
	throw "Not Implemented"
}


//------------------PRIOR KNOWLEDGE STUFF------------------------

async function backcast(args,context){

}

function p_parse_csv(csv,config={},pre_fetch=false){
	var promise = new Promise(async function(resolve, reject) {
		config['complete'] = resolve
		if(pre_fetch){
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
		// console.log("split")
		// console.log(split)
		// console.log(kc_table)
		// console.log(student_table)
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
		var [kc_json,stu_json] = await read_afm_table(abs_path(args['afm_stats'],context))
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

	var table_path = abs_path(args['error_table'],context)
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

	// console.log("opp_by_kc")
	// console.log(opp_by_kc)
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

async function gen_pretraining(args,context,shuffle=false){
	//Get the number of opportunities for each KC
	var opp_by_kc = await evalJSONFunc(args['opportunities'],context)
	console.log("opp_by_kc")
	console.log(opp_by_kc)
	opp_by_kc = {...opp_by_kc}

	
	var pivot_table
	if(typeof(args['step_pivot_table']) == "string"){
		alert("NOT IMPLEMENTED")
		// pivot_table = await p_parse_csv(abs_path(args['step_pivot_table'],context),
		// { delimiter: "\t",header: true, dynamicTyping: true},true)	
	}else{
		pivot_table = await evalJSONFunc(args['step_pivot_table'],context)
	}
	
	
	console.log("pivot_table")
	console.log(pivot_table)

	var problem_pool = Object.keys(pivot_table)
	if(shuffle){problem_pool = random.shuffle(problem_pool)}
	var out = []

	console.log("problem_pool")
	console.log(problem_pool)

	//For all problems add to problem set if any kc needs more practice. 
	//	 If not all KCs need practice only train KCs that need practice.
	for(var p of problem_pool){
		var all=true
		var any=false
		var only_steps = []
		var prob = pivot_table[p]
		for(var kc in prob){
			if(opp_by_kc[kc] > 0){
				opp_by_kc[kc] -= 1
				var steps = prob[kc]
				steps = Array.from(steps)
				if(steps.length==1){steps = steps[0]}
				only_steps.push(steps)
				any=true
			}else{
				all=false
			}
		}
		
		if(any){
			var o = {}
			o[args['problem_key']] = p
			if(!all){o['only_steps'] = only_steps}
			out.push(o)
		}
	}

	//Throw an error if there weren't enough problems
	if(Object.values(opp_by_kc).reduce((a,b) => a + b, 0) > 0){
		var error = "Insufficient problems in problem_pool to pretrain requested number of steps. " + 
			"Additional problems required for KCs/Steps: " + JSON.stringify(opp_by_kc)
		context.network_layer.kill_this(error)
		console.error(error)
	}

	console.log("gen_pretraining")
	console.log(out)

	console.log("opp_by_kc")
	console.log(opp_by_kc)
	return o
}

async function gen_pivot_table(args,context){
	var pivot_table

	//If cache location speficied just read from the cache
	if("cache" in args){
		var pivot_table_csv = await p_parse_csv(abs_path(args['cache'],context))
		pivot_table = {}
		for(var row of pivot_table_csv){
			pivot_table[row['Problem Path']] = pivot_table[row['Problem Path']] || {}
			pivot_table[row['Problem Path']][row['KC']] = row['Step Names'].split(",")
		}
	}
	if(pivot_table == null){
		var transaction_file = abs_path(args['transaction_file'],context)
		var problem_pool = await evalJSONFunc(args['problem_pool'],context)
		var path_map = {}
		for(var p of problem_pool){
			path_map[path.basename(p).split(".")[0]] = p
		}
		
		//Get the column in the transaction file for the specified KC model.
		var kc_model_id = args['kc_model'] || null
		kc_model_id = kc_model_id != null ? 'KC ('+kc_model_id+')' : "Step Name" 
		
		//Read the transaction file on line at a time
		pivot_table = {}
		var config = {
			dynamicTyping: true,
			delimiter: "\t",
			header : true,
			download : true,
			step : function (row){
				row = row.data

				//Only record CORRECT steps (because others could be out of graph)
				if(row['Outcome'] === "CORRECT"){
					var p = path_map[row['Problem Name']] || null
					if(p != null){

						//Fill the pivot table Problem Path, KC, Step id
						if(!(p in pivot_table)){
							pivot_table[p] = {}
						}
						var kc_str = row[kc_model_id]
						if(kc_str){
							if(!(kc_str in pivot_table[p])){
								pivot_table[p][kc_str] = new Set()	
							}
							var step_id_set = pivot_table[p][kc_str]
							step_id_set.add(row['CF (step_id)'])
						}
					}
				}
			}
		}
		//Run the 'step' function specified above line by line-by-line to make the table.
		var url = context.network_layer.HOST_URL + transaction_file
		var nothing = await p_parse_csv(url,config,false)

		//If cache location specified cache the pivot table
		if("cache" in args){
			var csv = []
			for(var prob in pivot_table){
				var kc_table = pivot_table[prob]
				for(var kc in kc_table){
					csv.append({"Problem Path" : prob, "KC" : kc, "Step Names": kc_table[kc].join(",")})
				}

			}
			var csv_str = papa.unparse(csv,{delimiter: "\t", header:true, 'newline':'\n'})
			context.network_layer.write_file(abs_path(args['cache'],context), csv_str)
		}
		return pivot_table
	}
}

export async function evalString(){
	throw "Not Implemented"
}

export async function evalJSONFunc(spec, context){
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
}

// export async function evalFunc(name,args,context){
// 	if(name in registedFunctions){
// 		return await registedFunctions[name](args,context)
// 	}else{	
// 		throw "Function " + name + " is not a registed function."
// 	}
// }