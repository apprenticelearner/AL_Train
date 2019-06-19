import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableHighlight,ScrollView,View, Text, Platform, StyleSheet,SectionList,AppRegistry } from "react-native";
import Panel from './panel.js'

class SkillPanel extends Component{
	constructor(props){
        super(props);

        const selected_skill =  props.skill_set[Object.keys(this.props.skill_set)[0]][0]
        this.state = {
        	skills: [],
          selected_skill: selected_skill,
          selected_match: selected_skill['matches'][0] || undefined,
        };
      this.handleClickSkillItem = this.handleClickSkillItem.bind(this)
	}

  selectSkill(skill,match){
    this.setState({selected_skill: skill,
                    selected_match: match})     
  }

  daisyChain(fnc, rest){
    return (evt) => {fnc(evt,rest)};
  }
  handleClickSkillItem(evt,rest){
    const [title,index,match] = rest;
    this.selectSkill(this.props.skill_set[title][index],match)
    console.log(title,index,match)
    if(this.props.clicky_callback){
      this.props.clicky_callback(evt,rest)   
    }
    
  }


	render(){
		return (
		    <View style={skillbox_styles.content}>
		      
          <View style={liststyles.skill_list}>
          <ScrollView>
            {Object.keys(this.props.skill_set).map((title, index) => {
              let header = <TouchableHighlight underlayColor="#fff" >
                 <Text style={liststyles.sectionHeader}>{title}</Text>
              </TouchableHighlight> 
              // let itemStyle = liststyles.item;
              let rest = this.props.skill_set[title].map((skill, index) => {
                  const skill_eq = this.state.selected_skill==skill;
                  // console.log("IS",itemStyle)
                  // console.log("EQ",eq, index, (eq ? itemStyle.selectColor : itemStyle.backgroundColor))
                  let skill_elem = <TouchableHighlight underlayColor="#f1f1f1"
                             onPress={ this.daisyChain(this.handleClickSkillItem,[title,index]) } >
                            <Text style={[liststyles.item, skill_eq && liststyles.selected]} 
                            backgroundColor={"#ff00ffff"}>
                            
                            {skill['name']}</Text>
                        </TouchableHighlight>
                  let matches = [];
                  if("matches" in skill){
                      matches = skill["matches"].map((match,mIndex) => { 
                        const match_eq = this.state.selected_match==match;
                        // console.log()
                        let match_elem = <TouchableHighlight underlayColor="#919191"
                             onPress={ this.daisyChain(this.handleClickSkillItem,[title,index,match]) } >
                            <Text style={[liststyles.match,skill_eq && match_eq && liststyles.selected]}>{
                              String.fromCharCode(8226)+ " "+match.join(", ")
                            }</Text>
                        </TouchableHighlight>
                        return match_elem;
                      })
                  }
                  return [skill_elem].concat(matches);
                })
              console.log(title)
              console.log(header)
              console.log(rest)
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
		          <Text>{this.state.selected_skill.how}</Text>
		        </Panel>
		        <Panel title="Where"
		        	   collapsedHeight={this.props.collapsedHeight.where}>
		          <Text>{this.state.selected_skill.where}</Text>
		        </Panel>
		        <Panel title="When"
		        	   collapsedHeight={this.props.collapsedHeight.when}>
		          <Text>{this.state.selected_skill.when}</Text>
		        </Panel>
		        <Panel title="Which"
		        	   collapsedHeight={this.props.collapsedHeight.which}>
		          <Text>{this.state.selected_skill.which}</Text>
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
   flexBasis : 200,
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
  selected:{
    backgroundColor: "'rgba(156,200,156,1.0)'",
  },
  item: {
    flexWrap: 'wrap',
    padding: 4,
    paddingLeft: 6,
    fontSize: 14,
    borderBottomWidth: 1,
    borderColor: 'gray',
    backgroundColor: "'rgba(247,0,0,0.0)'",
    // selectColor: "'rgba(247,0,0,1.0)'",
  },
  match: {
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderColor: 'gray',
    padding: 3,
    textIndent:10,
    fontSize: 13,
    backgroundColor: "'rgba(252,252,252,1.0)'",

  },
})

// function no_op(){
// 	void 0;
// }

SkillPanel.propTypes = {
  collapsedHeight: PropTypes.object,
  clicky_callback: PropTypes.func,
}

SkillPanel.defaultProps = {
  collapsedHeight: {"how": 40,
					"where": 90,
					"when": 90,
					"which": 40,
					},
   skill_set: [],
   clicky_callback: () => {}
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