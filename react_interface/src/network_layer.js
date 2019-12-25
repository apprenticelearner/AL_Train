import autobind from 'class-autobind';
const AL_RETRY_LIMIT = 3;
const TIMEOUT = 100;

// var $ = require('jquery');

// var fetch = require("node-fetch");

function ignoreKeys(key,value){
    if(key=='matches') return undefined;
    else return value;
}

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

//https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
const fetch_retry = async (url, options, n=AL_RETRY_LIMIT,t=TIMEOUT,exp=true) => {
    for (let i = 0; i < n; i++) {
        try {
            return await fetch(url, options);
        } catch (err) {
        	console.log("AL ERROR Retrying",err)
            const isLastAttempt = i + 1 === n;
            if (isLastAttempt) throw err;
            console.log("waiting",exp ? t * Math.pow(2,i) : t)
        	await wait(exp ? t * Math.pow(2,i) : t)
        }
    }
};

const JSON_HEADERS = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }


export default class NetworkLayer {
	constructor(AL_URL,HOST_URL){
		this.AL_URL = AL_URL
		this.HOST_URL = HOST_URL
		autobind(this)
		// this.createAgent = this.createAgent.bind(this)
		// this.sendFeedback = this.sendFeedback.bind(this)
		// this.sendTrainingData = this.sendTrainingData.bind(this)
		// this.queryApprentice = this.queryApprentice.bind(this)
		// this.term_print = this.term_print.bind(this)
		// this.kill_this = this.kill_this.bind(this)
	}

	createAgent(context, event){

		var data = {
            'name': context.agent_name,
            'agent_type': context.agent_type,
            'project_id': context.project_id
        }
    	data = {...context.other_agent_data, ...data}

    	console.log(this.AL_URL + '/create/')

    	return fetch_retry(this.AL_URL + '/create/', 
    		{method: "POST",
    		 headers: JSON_HEADERS,
    		 body:JSON.stringify(data)}, 6)
    		 .then(res => res.json())
	}

	sendFeedback(context,event){
		console.log("sendFeedback")
		if (context.staged_SAI === null) {
	        console.error('cannot give feedback on no action.');
	    }

	    var data = {...context.staged_SAI,"state":context.state}
	    // if(data.reward == null && context.reward != null){
	    // 	data.reward = context.reward
	    // }
	    if(context.interactive){
	        data['kwargs'] = {'add_skill_info':true}
	    }
	    
		return this.sendTrainingData(data,context.agent_id)   
	}

	sendFeedbackExplicit(context,event){
		console.log("sendFeedback EXPLICIT")
		// const staged_SAI = context.staged_SAI;
		const agent_id = context.agent_id;
		const state = context.state
		const skill_applications = context.skill_applications
		const feedback_map = context.feedback_map

		var skill_applications_subset = []
		var rewards = []
		for (var index in feedback_map){
			var skill_app = skill_applications[index]
			skill_applications_subset.push({
				"rhs_id" : skill_app["rhs_id"],
                "mapping" : skill_app["mapping"]
			})
			var reward = feedback_map[index].toLowerCase() == "correct" ? 1 : -1
			rewards.push(reward);
		}
		// if(!reward){
		// 	reward = staged_SAI.reward
		// }
		// var staged_SAI = context.staged_SAI

	    // if (staged_SAI === null && context.explanations == null) {
	    //     console.error('cannot give feedback on no action.');
	    // }

	    // var reward = 

	    // staged_SAI.reward = reward
	    // if(!explicit){
	    //     staged_SAI.state = state
	        
	    // }
	    // var rewards = context.rewards || [staged_SAI.reward]
	    // var skill_applications = context.skill_applications || [{
	    //                 "rhs_id" : staged_SAI["rhs_id"],
	    //                 "mapping" : staged_SAI["mapping"]
	    //             }];

	    var data = {state: state,
	                skill_applications: skill_applications_subset,
	                rewards: rewards,
	                // selection : staged_SAI.selection,
	                // reward : rewards[0],
	            	}
	    console.log("EXPLICIT DATA",data)
	    if(context.interactive){
	        data['kwargs'] = {'add_skill_info':true}
	    }

	    return this.sendTrainingData(data,context.agent_id)

	    // const URL = this.AL_URL + '/train/' + context.agent_id + '/'
    	// return fetch_retry(URL, 
    	// 	{method: "POST",
    	// 	 headers: JSON_HEADERS,
    	// 	 body:JSON.stringify(data)})
    	// 	 .then(res => res.json())
		    // $.ajax({
		    //     type: 'POST',
		    //     url: AL_URL + '/train/' + agent_id + '/',
		    //     data: JSON.stringify(data),
		    //     contentType: "application/json; charset=utf-8",
		    //     retryLimit : AL_RETRY_LIMIT,
		    //     tryCount : 0,
		    //     error: ajax_retry_on_error,

		    //     success: (resp) => {on_train_success(data,resp)}
		    // });
	}
	

	sendTrainingData(data,agent_id) {
		console.log("sendTrainingData")
	    // console.log("SAI: ", sai_data)

	    // loggingLibrary.logResponse (transactionID,"textinput1","UpdateTextField","Hello World","RESULT","CORRECT","You got it!");
	    // console.log(sai_data)
	    const URL = this.AL_URL + '/train/' + agent_id + '/'
	    return fetch_retry(URL, 
	    		{method: "POST",
	    		 headers: JSON_HEADERS,
	    		 body:JSON.stringify(data,ignoreKeys)})
	    		.then(response => response.text())
				.then(text => {
				    try {
				        const data = JSON.parse(text);
				        return data
				        // Do your JSON handling here
				    } catch(err) {
				    	return {}
				       // It is text, do you text handling here
				    }
				});
	    		
		// $.ajax({
	 //        type: 'POST',
	 //        url: AL_URL + '/train/' + agent_id + '/',
	 //        data: JSON.stringify(sai_data,ignoreKeys),
	 //        contentType: "application/json; charset=utf-8",

	 //        // async: true,
	 //        // timeout: AL_TIMEOUT,
	 //        retryLimit : AL_RETRY_LIMIT,
	 //        tryCount : 0,
	 //        error: ajax_retry_on_error,

	 //        success: (resp) => {on_train_success(sai_data,resp)}
	 //    });
	}

	queryApprentice(context,event) {
		console.log("queryApprentice")

	    // if(interactive && staged_SAI && staged_SAI.selection == "done" && (staged_SAI.reward || 1) > 0){
	    //     return
	    // }
	    // if (agent_id == null) {
	    //     return;
	    // }

	    // if(verbosity > 0) console.log('querying agent');

	    // if (last_correct){
	    //     // console.log("SETTING STATE!");
	    //     // console.log(last_correct);
	    //     state = tutor.get_state();
	    // }

	    var data = {
	        'state': context.state
	    }
	    if(context.interactive){
	        data['kwargs'] = {'add_skill_info':true,'n':0}
	    }

	    const URL = this.AL_URL + '/request/' + context.agent_id + '/'

	    return fetch_retry(URL,
	    		{method: "POST",
	    		 headers: JSON_HEADERS,
	    		 body:JSON.stringify(data)})
	    		.then(res => res.json())

	}

	term_print(data){
	    return fetch_retry(this.HOST_URL,
		    		{method: "PRINT",
		    		 headers: {"Content-type": "text/plain; charset=utf-8"},
		    		 body:data})
	}

	kill_this(data){
	    return fetch_retry(this.HOST_URL,
		    		{method: "QUIT",
		    		 headers: {"Content-type": "text/plain; charset=utf-8"},
		    		 body:data})
	}

}
	    // console.log("STATE",state);

	    // console.log("QUERY!");

	    //!! if(EXAMPLES_ONLY){
	    //     if(interactive){
	    //         query_user_demonstrate(false);
	    //     }else{
	    //         post_next_example();    
	    //     }
	    // }else{
	        //!! request_history.push(data);
	        // data_str = 
	        // add_skill_info
        // $.ajax({
        //     type: 'POST',
        //     url: AL_URL + '/request/' + agent_id + '/',
        //     crossdomain : true,
        //     data: JSON.stringify(data),
        //     contentType: "application/json; charset=utf-8",
        //     dataType: 'json',

        //     // async: true,
        //     // timeout: AL_TIMEOUT,
        //     retryLimit : AL_RETRY_LIMIT,
        //     tryCount : 0,
        //     error: ajax_retry_on_error,



	            // success: function(resp) {
	            //     // console.log("RESP")
	            //     // console.log(resp)
	            //     if (jQuery.isEmptyObject(resp)) {
	            //     	event.service.send()
	            //         // console.log("RESPONSE EMPTY")
	            //         // if(interactive){
	            //         //     setSkillWindowState({})
	            //         //     query_user_demonstrate(false);
	            //         // }else{
	            //         //     post_next_example();    
	            //         // }
	                    
	            //     } else {
	                    
	            //         applicable_skills = resp['responses']//.map(value=>value['skill_info'])
	            //         // console.log(applicable_skills)
	            //         if(interactive){
	            //             setSkillWindowState({"Applicable Skills" : applicable_skills},propose_sai,feedback_queue_change,null,initial_select='first')
	            //             feedback_queue = {}    
	            //         }
	                    

	            //     	// staged_SAI = resp;

	            //         if(verbosity > 0) console.log('action to take!');
	            //         console.log("RESPONSE: ", resp);
	            //         currentElement = iframe_content.document.getElementById(resp.selection);
	            //         // console.log(resp)
	            //         if(!currentElement){
	            //         	console.log("Element " +resp.selection +" does not exist, providing example instead.");
	            //             alert("THIS HAPPENED... SO WE NEED TO ACTUALLY IMPLEMENT THIS.");
	            //             term_print('\x1b[0;30;47m' + "ERROR: Selection Not found : " + resp.selection + '\x1b[0m');
	            //         }else{
	            //             // console.log("STATE",state)

	            //             if(interactive){
	            //                 query_user_demonstrate(true)
	            //                 propose_sai(resp) 
	            //             }else{
	            //                 currentElement.addEventListener(CTAT_CORRECT, handle_correct);
	            //                 currentElement.addEventListener(CTAT_INCORRECT, handle_incorrect);    
	            //                 console.log("REEEEZ",resp)
	            //                 apply_sai(resp);    
	            //             }
	                        
	                        
	            //         }
	                    
	            //         // query_user_feedback(resp);
	            //     }
	            // },
	            // error: function (resp){
	            // 	createAgent(queryApprentice);
	            // }
	        // });
	    // }
	// }

