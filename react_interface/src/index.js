import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import SkillPanel from './components/skill_panel';
import Buttons from './components/buttons';
import * as serviceWorker from './serviceWorker';
import ButtonsMachine from './state_machine.js'

import { interpret } from 'xstate';
import CTAT_Tutor from './ReactCTAT_Tutor';
import App from './App';



ReactDOM.render(
		<App style={{"height":"100%"}}/>
		, document.getElementById('root'));	





if(false){
	// function setSkillWindowState(evt){

	// }
	window.state_machine = ButtonsMachine.initialState
	window.state_machine_service = interpret(ButtonsMachine)
	window.state_machine_service.start()


	// const state = {
	//   current: 
	// };
	// window.state_machine_service.onTransition(current => {
	// 	console.log("current.value")
	// 	console.log(current.value)
	// 	setButtonsState(current,window.debugmode)
	  
	//   // this.setState({ current : current })
	//   }
	// );



	// function setButtonCallbacks(callbacks){
	// window.button_callbacks = callbacks
	// }
	// window.setButtonCallbacks = setButtonCallbacks

	// function setNoolsCallback(callback){
	// 	window.nools_callback = callback
	// }
	// window.setNoolsCallback = setNoolsCallback


	function setSkillWindowState(skill_set, select_callback,
								 correctness_callback, initial_select=null,
								 where_colors=null){
		ReactDOM.render(
			//<View>
			<CTAT_Tutor></CTAT_Tutor>
			//<SkillPanel skill_set={skill_set}
			//						select_callback={select_callback}
			//						correctness_callback={correctness_callback}
		//							initial_select={initial_select}
		//							where_colors={where_colors || undefined}
	//								current = {window.state_machine}
	//								service = {window.state_machine_service}
	//								
	//								/>
	//		</View>
			, document.getElementById('skill_panel'));	
	}


	function setButtonsState(current,debugmode=false){
		window.state_machine = current;
		ReactDOM.render(<Buttons current={current}
						 service={window.state_machine_service}
						 debugmode={debugmode}
						 callbacks={window.button_callbacks}
						 nools_callback={window.nools_callback}/>,
		 document.getElementById('buttons'));	
	}

	window.setSkillWindowState = setSkillWindowState
	window.setButtonCallbacks = setSkillWindowState
	window.setButtonsState = setButtonsState

	// function render(){
	// let sections = [
	// 	              {title: 'D', data: ['Devin the long named fool']},
	// 	              {title: 'J', data: ['Jackson', 'James', 'Jillian', 'Jimmy', 'Joel', 'John', 'Julie']},
	// 	              {title: 'B', data: ['Backson', 'Bames', 'Billian', 'Bimmy', 'Boel', 'Bohn', 'Bulie']},
	// 	            ];


	let test_skills = {"explanations": [
					
					{"name" : "E0 + E1",
					 "how": "E0 + E1",
					 "where": {"A":{"B":1}},
					 "when": "WHEN PART",
					 "which": 7.0,
					 'mapping': {"?sel": 'A1', "?arg0": 'B1',"?arg1": 'C1'}
					},
					{"name" : "E0 + E1",
					 "how": "E0 + E1",
					 "where": "WHERE PART",
					 "when": "WHEN PART",
					 "which": 7.0,
					 'mapping': {"?sel": 'A2', "?arg0": 'B2',"?arg1": 'C2'}
					},
					{"name": "(E0 + E1) // 10",
					 "how": "(E0 + E1) // 10",
					 "where": "WHERE PART",
					 "when": "WHEN PART",
					 "which": 4.0,
					 'mapping': {"?sel": 'A1', "?arg0": 'B1',"?arg1": 'C1'}

					},
					{"name": "(E0 + E1) // 10",
					 "how": "(E0 + E1) // 10",
					 "where": "WHERE PART",
					 "when": "WHEN PART",
					 "which": 4.0,
					 'mapping': {"?sel": 'A2', "?arg0": 'B2',"?arg1": 'C2'}
					}
				 ],
				 "other skills": [
			 		{"name": "(E0 + E1) // 10",
					 "how": "E0 + E1 + E2",
					 "where": "WHERE PART (E0 + E1 + E2)",
					 "when": "WHEN PART (E0 + E1 + E2)",
					 "which": 3.0,
					},
					{"name": "(E0 + E1 + E2) // 10",
					 "how": "E0 + E1",
					 "where": "WHERE PART ((E0 + E1 + E2) // 10)",
					 "when": "WHEN PART ((E0 + E1 + E2) // 10)",
					 "which": 8.0,
					},
				 ]


				};
	// setSkillWindowState({"skills:": []});

	if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
		window.debugmode = true;
		window.query_apprentice = () => {};
		setButtonsState(window.state_machine,true)
		setSkillWindowState(test_skills);
	}else{
		window.debugmode = false
	}
}
// setButtonsState("press_next",true,true);

// }
// document.getElementById('render_button').addEventListener("click",render)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
