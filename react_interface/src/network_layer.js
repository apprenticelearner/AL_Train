import autobind from "class-autobind";
const AL_RETRY_LIMIT = 3;
const TIMEOUT = 100;

// var $ = require('jquery');

// var fetch = require("node-fetch");

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function ignoreKeys(key, value) {
  if (key == "matches") return undefined;
  else return value;
}

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

//https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
const fetch_retry = async (
  url,
  options,
  n = AL_RETRY_LIMIT,
  t = TIMEOUT,
  exp = true
) => {
  for (let i = 0; i < n; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      console.log("AL ERROR Retrying", err);
      const isLastAttempt = i + 1 === n;
      if (isLastAttempt) throw err;
      console.log("waiting", exp ? t * Math.pow(2, i) : t);
      await wait(exp ? t * Math.pow(2, i) : t);
    }
  }
};

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

export default class NetworkLayer {
  constructor(AL_URL, HOST_URL, OUTER_LOOP_URL) {
    this.AL_URL = AL_URL;
    this.HOST_URL = HOST_URL;
    this.OUTER_LOOP_URL = OUTER_LOOP_URL;
    this.request_history = [];
    autobind(this);
    // this.createAgent = this.createAgent.bind(this)
    // this.sendFeedback = this.sendFeedback.bind(this)
    // this.sendTrainingData = this.sendTrainingData.bind(this)
    // this.queryApprentice = this.queryApprentice.bind(this)
    // this.term_print = this.term_print.bind(this)
    // this.kill_this = this.kill_this.bind(this)
  }

  createAgent(context, event) {
    this.term_print("Creating Agent: " + context.agent_name, "INFO");
    var data = {
      name: context.agent_name,
      agent_type: context.agent_type,
      project_id: context.project_id
    };
    data = { ...context.other_agent_data, ...data };

    console.log(this.AL_URL + "/create/");

    this.request_history = [];
    return fetch_retry(
      this.AL_URL + "/create/",
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(data) },
      6,
      1000,
    ).then(res => res.json());
  }

  _pack_feedback_data(skill_app,context){
    var data = {
        state: context.state,
        next_state: context.tutor.getState(),
        selection: skill_app["selection"],
        action: skill_app["action"],
        inputs: skill_app["inputs"],
        foci_of_attention: skill_app["foci_of_attention"],
        rhs_id: skill_app["rhs_id"],
        mapping: skill_app["mapping"],
        reward: skill_app["reward"],
        stu_resp_type: skill_app['stu_resp_type'] || context.stu_resp_type
      };
    console.log("DATA", data,skill_app)
    return data
  }

  sendFeedback(context, event) {
    console.log("sendFeedback", context.staged_SAI);
    const skill_applications = context.skill_applications || [context.staged_SAI];

    if (context.skill_applications === null) {
      console.error("cannot give feedback on no action.");
    }

    var out = new Promise((resolve)=>{resolve(null)})
    var d_list = [];
    for (var skill_app of skill_applications) {
      let data = this._pack_feedback_data(skill_app,context);
      
      if (context.interactive) {
        data["add_skill_info"] = true;
      }

      out = out.then((resp)=>this.sendTrainingData(data,context.agent_id))

      if(this.OUTER_LOOP_URL){
        out = out.then((resp)=>
          this.updateOuterLoopController(data, context)
        )
      }
    }
    // } else {
    //   var skill_app = context.staged_SAI;
    //   var data = this._pack_feedback_data(skill_app,context)
    //   if (context.interactive) {
    //     data["add_skill_info"] = true;
    //   }
    //   out = this.sendTrainingData(data, context.agent_id);
    //   console.log("BLEEP",this.OUTER_LOOP_URL, context)
    //   if(this.OUTER_LOOP_URL && context.outer_loop_controller){
    //     out = out.then((resp)=>
    //       this.updateOuterLoopController(data, context)
    //     )
    //   }
    // }

    return out;
  }


  sendTrainingData(data, agent_id) {
    console.log("sendTrainingData");
    // console.log("SAI: ", sai_data)

    // loggingLibrary.logResponse (transactionID,"textinput1","UpdateTextField","Hello World","RESULT","CORRECT","You got it!");
    // console.log(sai_data)
    const URL = this.AL_URL + "/train/" + agent_id + "/";
    return fetch_retry(URL, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data, ignoreKeys)
    })
      .then(response => response.text())
      .then(text => {
        try {
          const data = JSON.parse(text);
          return data;
          // Do your JSON handling here
        } catch (err) {
          return {};
          // It is text, do you text handling here
        }
      });


  }

  queryApprentice(context, event) {
    console.log("queryApprentice");

    var data = {
      state: context.state
    };
    var kwargs = {}
    if (context.interactive) kwargs['add_skill_info'] = true;
    if (context.whole_conflict_set) kwargs['n'] = 0;

    data["kwargs"] = kwargs

    this.request_history.push(data);

    const URL = this.AL_URL + "/request/" + context.agent_id + "/";

    return fetch_retry(URL, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data)
    }).then(res => res.json());
  }

  checkApprentice(context, event) {
    console.log("checkApprentice");

    var data = {
      state: context.state,
      ...context.staged_SAI
    };

    const URL = this.AL_URL + "/check/" + context.agent_id + "/";

    return fetch_retry(URL, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(json => +json["reward"]);
  }

  term_print(message, type = "default") {
    var data = { message: message, type: type };
    return fetch_retry(this.HOST_URL, {
      method: "PRINT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data)
    });
  }

  kill_this(message, type = "error") {
    var data = { message: message, type: type };
    return fetch_retry(this.HOST_URL, {
      method: "QUIT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data)
    });
  }

  write_file(file, data) {
    var data = {
      file: file,
      data: data
    };
    return fetch_retry(this.HOST_URL, {
      method: "WRITE",
      headers: JSON_HEADERS,
      body: JSON.stringify(data)
    });
  }

  sendProblemDone(context,event){
    //NOT YET IMPLEMENTED -- Might not need to
    // var data = {}
    // return fetch_retry(this.HOST_URL, {
    //   method: "PROBLEM_DONE",
    //   headers: JSON_HEADERS,
    //   body: JSON.stringify(data, ignoreKeys)
    // })
  }

  generate_nools(context, event) {
    const URL = this.AL_URL + "/get_skills/" + context.agent_id + "/";
    var data = { states: this.request_history.map(x => x["state"]) };
    return fetch_retry(URL, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data, ignoreKeys)
    })
      .then(res => res.json())
      .then(json => {
        console.log("NOOLS DIR: ", context.nools_dir);
        var out_data = {
          nools_dir: context.nools_dir,
          problems: context.start_state_history,
          skills: json
        };
        return fetch(this.HOST_URL, {
          method: "GEN_NOOLS",
          headers: JSON_HEADERS,
          body: JSON.stringify(out_data, ignoreKeys)
        });
      });
  }

  

  generateBehaviorProfile(context, event = {}) {
    // data = {'states':request_history.map(x => x['state'])}
    // console.log(JSON.stringify(data))

    // requests = request_history
    event.data = event.data || {};
    var requests = event.data.requests || this.request_history;
    var dir = event.data.out_dir || (context.working_dir || ".") + "/bprofiles";
    var HOST_URL = this.HOST_URL;
    var AL_URL = this.AL_URL;
    // requests = ground_truth_requests

    // console.log(nools_dir)
    var now = new Date();
    var elapse =
      (((now - context.agent_start_time) % 86400000) % 3600000) / 60000;
    var start_data = { dir: dir, elapse_minutes: elapse.toFixed(1) };

    var promise = fetch(HOST_URL, {
      method: "START_BEHAVIOR_PROFILE",
      headers: JSON_HEADERS,
      body: JSON.stringify(start_data)
    }).then(async function(whatever) {
      for (let item of requests) {
        // requests.forEach(function (item, index) {
        var s = item["state"];
        var data = {
          state: s,
          kwargs: { add_skill_info: true, n: -1 }
        };
        var resp = await fetch_retry(
          AL_URL + "/request/" + context.agent_id + "/",
          {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify(data)
          }
        ).then(res => res.json());

        var responses = [];
        if ("responses" in resp) {
          resp["responses"].forEach(function(r, index) {
            var sai = {
              selection: r["selection"],
              action: r["action"],
              inputs: r["inputs"]
            };
            console.log(r);
            console.log(r["selection"]);
            responses.push(sai);
          });
        }
        var completeness_data = {
          state: s,
          responses: responses,
          dir: dir
        };
        await fetch(HOST_URL, {
          method: "APPEND_BEHAVIOR_PROFILE",
          headers: JSON_HEADERS,
          body: JSON.stringify(completeness_data)
        });
      }
    });
    return promise;
  }

  newOuterLoopController(controller, context) {
    var data = {
      outer_loop_type: controller["type"] || controller["outer_loop_type"],
      problem_set: controller["problem_set"],
      outer_loop_args: controller["args"] || controller["outer_loop_args"],
      id: context.agent_id
    };



    console.log(this.OUTER_LOOP_URL);
    console.log("outer loop data:", data);
    console.log("outer loop context:", context);
    var out = fetch(this.OUTER_LOOP_URL, {
      method: "NEW_STUDENT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data)
    }).then(res => {});
    
    return out;
  }

  updateOuterLoopController(data, context){
    // console.log("UPDATE OUTER LOOP",controller, data, context)
    var update_data = {
      selection : data['selection'],
      reward : data['reward'],
      stu_resp_type : context.stu_resp_type,
    }
    return fetch_retry(this.OUTER_LOOP_URL, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(update_data)
    })
    // console.log('sel', data['selection'])
    // console.log('reward', data['reward'])
    // console.log('stu_resp_type', context.stu_resp_type)
    // console.log('problem_name', context.tutor.getProblemName() || null)

  }

  nextProblem(controller, context) {
    var data = {
      id: context.agent_id
    };

    var out = fetch(this.OUTER_LOOP_URL, {
      method: "NEXT_PROBLEM",
      headers: JSON_HEADERS,
      body: JSON.stringify(data)
    }).then(res => res.json());
    return out;
  }

  glob(path, context) {
    path = path.replace(/\.\./g,"!u")
    if (path[0] != "/") {
      path = context.working_dir + "/" + path;
    }
    var out = fetch(this.HOST_URL, {
      method: "GLOB",
      headers: JSON_HEADERS,
      body: JSON.stringify(path)
    }).then(res => res.json());
    return out;
  }


}
