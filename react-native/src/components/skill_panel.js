import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableHighlight,ScrollView,View, Text, Platform, StyleSheet,SectionList,AppRegistry } from "react-native";
import Panel from './panel.js'

class SkillPanel extends Component{
	constructor(props){
        super(props);

        this.state = {
        	skills: []

        };

	}
	render(){
		return (
		    <View style={skillbox_styles.content}>
		      
          <View style={liststyles.skill_list}>
  		      <ScrollView >
  		      
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
  		      
  		      </ScrollView>
          </View>

          
		      <ScrollView style={liststyles.skill_info}
		                 showsVerticalScrollIndicator={true}
		                 
		                 // contentInset= {{top: 20, left: 20, bottom: 0, right: 20}}
		                 >
		        <Panel title="How"
		        	   collapsedHeight={this.props.collapsedHeight.how}>
		          <Text>Lorem ipsum dolor sit amet...</Text>
		        </Panel>
		        <Panel title="Where"
		        	   collapsedHeight={this.props.collapsedHeight.where}>
		          <Text>Lorem ipsum Lorem ipsum Lorem ipsum dolor sit amet,Lorem ipsum dolor sit amet,Lorem ipsum dolor sit amet,Lorem ipsum dolor sit amet,Lorem ipsum dolor sit amet,Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Text>
		        </Panel>
		        <Panel title="When"
		        	   collapsedHeight={this.props.collapsedHeight.when}>
		          <Text>Lorem ipsum...</Text>
		        </Panel>
		        <Panel title="Which"
		        	   collapsedHeight={this.props.collapsedHeight.which}>
		          <Text>Lorem ipsum dolor sit amet...</Text>
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
    "flexDirection":"row",
    // flex: 1,
    // justifyContent: "flex-start",
    // alignItems: "left",
    backgroundColor: "#F5FCFF",
    "width":"100%",
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
    // top: 100,
    // left: 100,
    // height : "100%",

  },
});

const liststyles = StyleSheet.create({
  skill_list: {
   
   // width: 200,
   // flex: 0,
   flexBasis : 200,
   // flexGrow : 0,
   // justifyContent: 'flex-start',
   paddingTop: 10,
   // paddingRight: 22,
   // justifyContent: "left",
   // width:'50%',
  },
  skill_info: {
   flex: 1,
   // flexBasis : "80%",
   // flexGrow: 1,
   // flexShrink : 1,
   // justifyContent: 'flex-start',
   paddingTop: 10,
   // paddingRight: 22,
   // justifyContent: "left",
   // width:'50%',
  },
  sectionHeader: {
    // flexBasis : 100,
    flexWrap: 'wrap',
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: "'rgba(247,247,247,1.0)'",
  },
  item: {
    flexWrap: 'wrap',
    padding: 5,
    fontSize: 18,
    // height: 30,
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
   sections: [],
   clicky_callback: () => {}
}

export default SkillPanel;