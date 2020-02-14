import path from 'path'

const type_map = {
	"bestintersect" : applyBestInstersect
}


export function applyPriorKnowledge(context,spec,iter){
	var type = spec.type.toLowerCase().replace("_", "")
	return type_map[type](spec,iter)

}


function buildTransactionCache(){

}

function assertTransactionCache(){

}

async function applyBestInstersect(context,spec,pk_iter){
	// var promise = new Promise((resolve, reject) => {
	var cache_folder = spec["cache_folder"] || (context.working_dir + "/" + ".pkcache")
	var cache = cache_folder + "/" + path.basename(context.training_file) + ".cache"
	console.log("MOOOOOOOOO", cache)
	var cache_content = await fetch(cache)
	 	.then(function(response) {
	 		if (!response.ok) {
	            throw Error(response.statusText);
	        }
	        return response
	 	})
		.then((response) => response.text())
		.catch((error) => {return null})

	var out
	if(cache_content == null || (false && "should also check md5sum of agentobj &&")) {
		//No Cached Data -- Building by sampling from problems 
		out = { updateContext : 
				{
					prior_knowledge : [spec] + pk_iter,
					problem_iterator : [] //?
				},
				train_now : true
			  }
	}else{
		//Cached Data Exists -- Training by 
		out = { updateContext : 
				{
					prior_knowledge : pk_iter,
					problem_iterator : [] //?
				},
				train_now : true
			  }
	}

	return out


	// }

}