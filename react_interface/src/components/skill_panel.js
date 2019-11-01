import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableHighlight,ScrollView,View, Text, StyleSheet } from "react-native";
import Panel from './panel.js'



function cramBtw(arr,sep){
  return [...arr].map((e, i) => i < arr.length - 1 ? [e, sep] : [e]).reduce((a, b) => a.concat(b))
}

function colorItems(text, items, colors){
  text = [text]
  // for(var item in colorMap) {
  items.forEach(function(item,i) {
    text = text.map((t,_) => {
      if(typeof t == 'string'){
        let splt = t.split(item)
        if(splt.length > 1){
         return cramBtw(splt,<Text style={
            {"color":colors[i],'textShadowRadius':3, 'textShadowColor': colors[i]}}>{item}</Text>);
         // return cramBtw(splt,<Text style={{"color":colorMap[item]}}>{item}</Text>);
        }
      }
      return t;
    }).flat();
  });
  return text;
}

const skill_text_by_action ={
  ButtonPressed: function(skill,colors) {
    return "Press Button"
  },
  UpdateTextField: function(skill,colors) {
    return skill['name'] || skill['how'];
  }

};

const match_text_by_action = {
  UpdateTextField: function(match,colors) {
    let sel = match['mapping']['?sel']
    let args =  Object.entries(match['mapping']).reduce(
      function (acc,kv) {if(kv[0] !== "?sel") {acc.push(kv[1])}return acc;},[]);
    // console.log(sel,args)
    sel = sel.replace("?ele-","")
    args = args.map(x => x.replace("?ele-",""))
    let innerHTML = /*String.fromCharCode(8226) +*/ "(" + args.join(", ") + "): " + sel + "->" + (match['inputs'] && match['inputs']['value']);
    innerHTML = colorItems(innerHTML,[sel].concat(args), colors); // innerHTML = cramBtw( innerHTML.split("A1"),<Text style={{"color":"red"}}>A1</Text>);
    return innerHTML;
  },
  ButtonPressed: function(match,colors) {
    return "Press: " + match['mapping']['?sel'].replace("?ele-","");
  }                          
}


class SkillPanel extends Component{
  constructor(props){
        super(props);


        this.s_skill_set = this.structure_skills(props.skill_set)
        
        var select = this.starting_selection();
        // const selected_skill = 0;
        this.state = {
          selected_skill: select,
          selected_match: select,
          correctness_map:{},
        };
      this.handleClickSkillItem = this.handleClickSkillItem.bind(this)
      this.handleClickCorrectnessButton = this.handleClickCorrectnessButton.bind(this)
  }

  starting_selection(){
    if(this.props.initial_select == "first"){
      let first_key = Object.keys(this.s_skill_set)[0];
      return first_key==null ? null : this.s_skill_set[first_key][0];
    }

  }

  structure_skills(skill_set){
    const s_skill_set = {}
    var id_count = 0;
    for (var title in skill_set) {
      let skills = {};

      for (var i in skill_set[title]){
        var skill = skill_set[title][i]
        if(!(skill['how'] in skills)){
          
          skills[skill['how']] = skill;
          skills[skill['how']]['matches'] = []
          // delete skills[skill['how']]["mapping"]

        }
        skill['_id'] = id_count++;
        skills[skill['how']]['matches'].push(skill);

      // console.log(skills)
      s_skill_set[title] = Object.keys(skills).map((key,index)=>skills[key]);
      }

    }
    return s_skill_set
    // console.log(skill_set)
  }
	

  selectSkill(skill,match){
    if(!match){
      match = skill
    }
    this.setState({selected_skill: skill,
                    selected_match: match})     
  }

  daisyChain(fnc, rest,callback){
    return (evt) => {fnc(evt,rest,callback)};
  }
  handleClickSkillItem(evt,rest,callback){
    const [skill,match] = rest;
    // console.log(title,index,match)
    // this.selectSkill(this.props.skill_set[title][index],match)
    this.selectSkill(skill,match)
    console.log(this.props.select_callback)
    if(this.props.select_callback){
      this.props.select_callback(match || skill)   
    }
    if(callback){
      callback(rest)
    }
    
  }
  handleClickCorrectnessButton(evt,rest){
    const [skill,match,label] = rest;
    // console.log(skill)
    // console.log(match)
    // console.log(label)
    let match_id = match["_id"];
    // console.log(match["_id"])
    // console.log(this.state.correctness_map)
    let new_label = (this.state.correctness_map[match_id]
           && label === this.state.correctness_map[match_id]) ? null : label;
    
    let new_correctness_map = {...this.state.correctness_map};
    if(new_label === null){
      delete new_correctness_map[match_id];
    }else{
      new_correctness_map[match_id] = new_label;
    }
    
    let was_empty = Object.keys(this.state.correctness_map).length === 0
    let now_empty = Object.keys(new_correctness_map).length === 0
    if(!was_empty && now_empty){
      console.log("EMPTY")
      this.props.service.send("SKILL_PANEL_FEEDBACK_EMPTY")
    }else if(was_empty && !now_empty){
      console.log("NOT EMPTY")
      this.props.service.send("SKILL_PANEL_FEEDBACK_NONEMPTY")
    }

    this.setState({correctness_map : new_correctness_map});

    console.log(new_correctness_map)

    if(this.props.correctness_callback){
      this.props.correctness_callback(match || skill,new_label)
    }


  }
  componentWillReceiveProps(nextProps){
    this.s_skill_set = this.structure_skills(nextProps.skill_set)
    let s_keys = Object.keys(this.s_skill_set)
    this.setState({
      correctness_map: {}
    })

    if(s_keys.length > 0){// && !this.state.selected_skill || !this.state.selected_skill){
      let select = this.s_skill_set[s_keys[0]][0]
      this.setState({
          selected_skill: select,
          selected_match: select,
      })
    }else{
      this.setState({
          selected_skill: null,
          selected_match: null,
      })
    }
    // }
  }


	render(){
    // console.log(this.s_skill_set)
    // this.s_skill_set = this.structure_skills(this.props.skill_set)
    
    

    // this.state = 
		return (
		    <View style={skillbox_styles.content}>
		      
          <View style={liststyles.skill_list}>
          <ScrollView>
            {Object.keys(this.s_skill_set).map((title, index) => {
              let header = <TouchableHighlight underlayColor="#fff" >
                 <Text style={liststyles.sectionHeader}>{title}</Text>
              </TouchableHighlight> 
              // let itemStyle = liststyles.item;
              let rest = this.s_skill_set[title].map((skill, index) => {
                  const skill_eq = this.state.selected_skill && this.state.selected_skill['_id']===skill['_id'];
                  // console.log(skill_eq)
                  // console.log("IS",itemStyle)
                  // console.log("EQ",eq, index, (eq ? itemStyle.selectColor : itemStyle.backgroundColor))
                  let innerHTML = (skill_text_by_action[skill.action] || skill_text_by_action["UpdateTextField"])(skill,this.props.where_colors)
                  let skill_elem = <TouchableHighlight underlayColor="#f1f1f1"
                             onPress={ this.daisyChain(this.handleClickSkillItem,[skill],
                                                       skill['callback']) } >
                            <Text style={[liststyles.item, skill_eq && liststyles.selected_skill]} 
                            backgroundColor={"#ff00ffff"}>{
                              innerHTML}</Text>
                        </TouchableHighlight>
                  let matches = [];
                  if("matches" in skill){
                      // console.log(skill["matches"])
                      matches = skill["matches"].map((match,mIndex) => {
                        if('mapping' in match){
                          const match_eq = this.state.selected_match && this.state.selected_match['_id']===match['_id'];
                          
                          // let sel = match['mapping']['?sel']
                          // let args =  Object.entries(match['mapping']).reduce(
                          //   function (acc,kv) {if(kv[0] != "?sel") {acc.push(kv[1])}return acc;},[]);
                          // console.log(sel,args)
                          // sel = sel.replace("?ele-","")
                          // args = args.map(x => x.replace("?ele-",""))
                          // let innerHTML = String.fromCharCode(8226) + "(" + args.join(", ") + "):" + sel + "->" + (match['inputs'] && match['inputs']['value']);
                          // innerHTML = colorItems(innerHTML,{"B1":'red',"A1":'green'}); // innerHTML = cramBtw( innerHTML.split("A1"),<Text style={{"color":"red"}}>A1</Text>);
                          // console.log(match_text_by_action,match.action)
                          let innerHTML = (match_text_by_action[match.action] || match_text_by_action["UpdateTextField"])(match,this.props.where_colors)
                          let correct = this.state.correctness_map[match["_id"]] === "correct";
                          let incorrect = this.state.correctness_map[match["_id"]] === "incorrect";
                          // console.log(this.state.correctness_map)
                          let match_view = <View style={liststyles.match_container}> 

                            <TouchableHighlight underlayColor="#919191"  
                            onPress = {this.daisyChain(this.handleClickCorrectnessButton,[skill,match,"correct"])}

                                 // onPress={ this.daisyChain(this.handleClickSkillItem,[skill,match], 
                                                           // match['callback'])} >
                                                           >
                                <Text style={[liststyles.correctness_button, correct && liststyles.correct_selected]}>{
                                  String.fromCharCode(10004)
                                  // innerHTML
                                  // String.fromCharCode(8226)+ " "+Object.values(match['mapping'] || {}).map(.join(", ")
                                }</Text>
                            </TouchableHighlight>
                            <TouchableHighlight underlayColor="#919191"  
                            onPress = {this.daisyChain(this.handleClickCorrectnessButton,[skill,match,"incorrect"])}
                                 // onPress={ this.daisyChain(this.handleClickSkillItem,[skill,match], 
                                                           // match['callback'])} >
                                                           >
                                <Text style={[liststyles.correctness_button, incorrect && liststyles.incorrect_selected]}>{
                                  String.fromCharCode(10006)
                                  // innerHTML
                                  // String.fromCharCode(8226)+ " "+Object.values(match['mapping'] || {}).map(.join(", ")
                                }</Text>
                            </TouchableHighlight>

                            
                            <TouchableHighlight underlayColor="#919191"
                                  style={{'flex': 1}}
                                 onPress={ this.daisyChain(this.handleClickSkillItem,[skill,match], 
                                                           match['callback'])} >
                                <Text style={[liststyles.match,skill_eq && match_eq && liststyles.selected_match]}>{
                                  innerHTML
                                  // String.fromCharCode(8226)+ " "+Object.values(match['mapping'] || {}).map(.join(", ")
                                }</Text>
                            </TouchableHighlight>
                          </View>

                          // let match_view = <View> {match_elem} </View>
                          // console.log(typeof match_elem)
                          return match_view;
                        }else{
                          return null;
                        }
                      })
                  }
                  matches = matches.filter(x => x != null); //remove undefinded
                  return [skill_elem].concat(matches);
                })
              // console.log(title)
              // console.log(header)
              // console.log(rest)
              return [header].concat(rest)
              })
            }
          </ScrollView>

            

          </View>

          
		      <ScrollView style={liststyles.skill_info}
		                 showsVerticalScrollIndicator={true}
		                 
		                 // contentInset= {{top: 20, left: 20, bottom: 0, right: 20}}
		                 >
		        <Panel title="How"
		        	   collapsedHeight={this.props.collapsedHeight.how}>
		          <Text>{this.state.selected_skill && this.state.selected_skill.how}</Text>
		        </Panel>
		        <Panel title="Where"
		        	   collapsedHeight={this.props.collapsedHeight.where}>
		          <Text>{this.state.selected_skill && JSON.stringify(this.state.selected_skill.where, null, 2)}</Text>
		        </Panel>
		        <Panel title="When"
		        	   collapsedHeight={this.props.collapsedHeight.when}>
		          <Text>{this.state.selected_skill && this.state.selected_skill.when}</Text>
		        </Panel>
		        <Panel title="Which"
		        	   collapsedHeight={this.props.collapsedHeight.which}>
		          <Text>{this.state.selected_skill && this.state.selected_skill.which}</Text>
		        </Panel>

		      </ScrollView>
          




		    </View>  
		  );
	}

}

const skillbox_styles = StyleSheet.create({
  content: {
    "display": "flex",
    "height" : "100%",
    // "flexDirection":"row-reverse",
    "flexDirection":"row",
    
    backgroundColor: "#F5FCFF",
    "width":"100%",
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
    
  },
});

const liststyles = StyleSheet.create({
  skill_list: {
   flexBasis : 250,
   paddingTop: 10,
  },
  skill_info: {
   flex: 1,
   paddingTop: 10,
  },
  sectionHeader: {
    flexWrap: 'wrap',
    paddingTop: 6,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 15,
    fontWeight: 'bold',
    backgroundColor: "'rgba(247,247,247,1.0)'",
  },
  selected_skill:{
    backgroundColor: "#93e4ec",
  },
  

  item: {
    flexWrap: 'wrap',
    padding: 4,
    paddingLeft: 6,
    fontSize: 16,
    borderBottomWidth: 1,
    borderColor: 'gray',
    backgroundColor: "'rgba(247,0,0,0.0)'",
  },
  correctness_button:{
    fontSize: 20,
    width:27,
    textAlign:"center",
    borderWidth:.1,
    borderColor: 'lightgray',

  },
  incorrect_selected:{
    // underlayColor:"#00FF00",
    backgroundColor: "red",
  },
  correct_selected:{
    backgroundColor: "limegreen",
  },
  match_container:{
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'gray',

  },
  match: {
    flex: 1,
    flexWrap: 'wrap',
    // justifySelf: 'stretch',
    padding: 3,
    textIndent:5,
    fontSize: 15,
    backgroundColor: "'rgba(252,252,252,1.0)'",

  },
  selected_match:{
    backgroundColor: "#b3e8ff",
  },
})

// function no_op(){
// 	void 0;
// }

SkillPanel.propTypes = {
  collapsedHeight: PropTypes.object,
  select_callback: PropTypes.func,
}

SkillPanel.defaultProps = {
  collapsedHeight: {"how": 40,
					"where": 90,
					"when": 90,
					"which": 40,
					},
   //"darkorchid", "#feb201",   "#ff884d", "#52d0e0", "#e44161",  "#2f85ee", "#562ac6", "#cc24cc"
   where_colors: [  "darkorchid",  "#ff884d",  "#52d0e0", "#feb201",  "#e44161", "#ed3eea", "#2f85ee",  "#562ac6", "#cc24cc"],
   select_callback: () => {}
}

export default SkillPanel;



            /*<ScrollView >
            
                <SectionList 
                  sections={this.props.sections}

                  renderSectionHeader={({section}) =>
                  <TouchableHighlight underlayColor="#f1f1f1" >
                   <Text style={liststyles.sectionHeader}>{section.title}</Text>
                  </TouchableHighlight>
                  }
                  renderItem={({item}) => 
                  <TouchableHighlight underlayColor="#f1f1f1"
                    onPress={this.props.clicky_callback}>
                   <Text style={liststyles.item}>{item}</Text>
                  </TouchableHighlight>
                  }

                  keyExtractor={(item, index) => index}
                />
            
            </ScrollView>*/