const AL_RETRY_LIMIT = 3;
// var $ = require('jquery');

// var fetch = require("node-fetch");

function ignoreKeys(key,value){
    if(key=='matches') return undefined;
    else return value;
}

//https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
const fetch_retry = async (url, options, n=AL_RETRY_LIMIT) => {
    for (let i = 0; i < n; i++) {
        try {
            return await fetch(url, options);
        } catch (err) {
        	console.log("AL ERROR Retrying",err)
            const isLastAttempt = i + 1 === n;
            if (isLastAttempt) throw err;
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
	}

	create_agent(context, event){

		var data = {
            'name': context.agent_name,
            'agent_type': context.agent_type,
            'project_id': context.project_id
        }
    	data = {...context.other_agent_data, ...data}

    	return fetch_retry(this.AL_URL + '/create/', 
    		{method: "POST",
    		 headers: JSON_HEADERS,
    		 body:JSON.stringify(data)})
    		 .then(res => res.json())
	}

	send_feedback(context,event,reward, explicit=false){
		console.log("SEND_FEEDBACK")
		const last_action = context.last_action;
		const agent_id = context.agent_id;
		const state = context.state

		if(!reward){
			reward = last_action.reward
		}
		// var last_action = context.last_action

	    if (last_action === null) {
	        console.error('cannot give feedback on no action.');
	    }

	    last_action.reward = reward
	    if(!explicit){
	        last_action.state = state
	        return this.send_training_data(context, event, last_action)   
	    }

	    var data = {state: state,
	                explanations: [{
	                    "rhs_id" : last_action["rhs_id"],
	                    "mapping" : last_action["mapping"]
	                }],
	                rewards:[reward],
	                selection : last_action.selection,
	                reward : reward,
	                };
	    if(context.interactive){
	        data['kwargs'] = {'add_skill_info':true}
	    }

	    const URL = this.AL_URL + '/train/' + context.agent_id + '/'
    	return fetch_retry(URL, 
    		{method: "POST",
    		 headers: JSON_HEADERS,
    		 body:JSON.stringify(data)})
    		 .then(res => res.json())
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
	

	send_training_data(context, event, sai_data) {
		console.log("SEND_TRAINING_DATA")
	    // console.log("SAI: ", sai_data)

	    // loggingLibrary.logResponse (transactionID,"textinput1","UpdateTextField","Hello World","RESULT","CORRECT","You got it!");
	    if(context.interactive){
	        sai_data['kwargs'] = {'add_skill_info':true}
	    }
	    console.log(sai_data)
	    const URL = this.AL_URL + '/train/' + context.agent_id + '/'
	    return fetch_retry(URL, 
	    		{method: "POST",
	    		 headers: JSON_HEADERS,
	    		 body:JSON.stringify(sai_data,ignoreKeys)})
	    		.then(res => res.json())
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

	query_apprentice(context,event) {
		console.log("QUERY_APPRENTICE")

	    // if(interactive && last_action && last_action.selection == "done" && (last_action.reward || 1) > 0){
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
	                    

	            //     	// last_action = resp;

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
	            // 	create_agent(query_apprentice);
	            // }
	        // });
	    // }
	// }

