
# coding: utf-8

# In[212]:

import json
import re, os

def how_to_js(how):
    # nools_how = "Then {\n        let "
    how = how.lstrip('g[')
    how = how.rstrip(']')

    if("//" in how):
        # left,right = how.split("//")
        # left = left.rstrip('(')
        how = "parseInt" + "/".join(how.split("//"))
        # print(how)

    # how_ele = re.findall('E'+r'\d', how)

    # for i in how_ele:
    #     how = how.replace(i, where_list[how_ele.index(i) + 1])
    nools_how = "let how = " + how +";"
    # nools_how = 

    
    return nools_how





problem_template = """
global start_state = {};
import("noolsrules.nools");
"""

# the head of the bootstrap part
boostrap_template = """
import("basetypes.nools");
rule bootstrap {
    when {
        s: Boolean s === false from false;
    }
    then {
        for (var i in start_state){
            var ie = start_state[i];
            let value = Number(ie.value) || ie.value;
            assert(new InterfaceElement(ie.id, ie.contentEditable, value));
            if(ie.value != "" && ie.id != "done" && ie.id != "hint"){                
                assert(new TPA(ie.id, "UpdateTextField" ,value));                
            }
        }
        setProblemAttribute("use_backtracking", true);
        halt();
    }
}
"""

rule_template = """
rule rule{rule_num:d} {{
    when{{
        {where:s}
        {when:s}
    }}then{{
        {how:s}
        if (checkSAI({sai:s})) {{
            modify(sel, "value", how);
            modify(sel, "contentEditable", false);
            halt();
        }} else {{
            backtrack();
        }}
    }}
}}


"""

# global problems_json
# global skills_json

def generate_nools(msg_json, nools_dir=""):
    nools_rule = ""
    nools_tpa = ""
    nools = ""
    k = 0
    prob_cnt = 0
    for key in msg_json:
    #     generate bootstrap codes
        if key == "problems":
            # prob_cnt = prob_cnt + 1
            for prob_cnt,x in enumerate(msg_json[key]):
                file_name = 'problem'+str(prob_cnt+1) + ".nools"
                # file_name = prob_name 
                f = open(os.path.join(nools_dir,file_name), 'w')
                f.write(problem_template.format(json.dumps(x)));
                f.close()
          
        if key == "skills":
            rule_cnt = 0
            skills_json = msg_json[key]
            rule_num = len(skills_json)
            rules = [''] * rule_num
            for j in range(rule_num):
                
                how = skills_json[j]['how']
                when_list = skills_json[j]['when']
                where_list = skills_json[j]['where']
                
                nools_how = how_to_js(how)
                   

                where_parts = []
                for i,name in enumerate(where_list):
                    if i == 0:
                        ie_name = "sel"
                        where_parts.append("{0}: InterfaceElement {0}.id == '{1}';".format(ie_name, name))
                    else:
                        ie_name = "where_ie%d" % (i-1)
                        where_parts.append("{0}: InterfaceElement {0}.id == '{1}' {{value : E{2}}};".format(ie_name, name, str(i-1)))
                    
                    

                when_parts = []

                for i,item in enumerate(when_list):
                    # print(item)
                    attribute, eleName = item[0].replace(")", "").replace("(", "").split(" ")
                    #TODO: WHY SEL HAS WEIRD RULES?
                    
                    if("foa" in eleName):
                        eleName = where_list[int(eleName.split("foa")[1])]

                    if(eleName == where_list[0]):
                    	continue
                    ie_name = "when_ie%s" % i
                    when_parts.append("{0} : InterfaceElement {0}.id == \"{1}\" && {0}.{2} {3} {4};".format(ie_name, eleName, attribute, item[1], item[2]))

                sai = '{selection: sel.id, action: "UpdateTextField", input: how}'
        
                rule = rule_template.format(rule_num=j,
                                            where="\n\t\t".join(where_parts),
                                            when="\n\t\t".join(when_parts),
                                            how=nools_how,
                                            sai=sai)


                rules[j] = rule
                nools_rule = nools_rule + rules[j]

                f = open(os.path.join(nools_dir,"noolsrules.nools"), 'w')
                f.write(boostrap_template + nools_rule);
                f.close()




# file = open('../multiColumnArith2.json','r',encoding='utf-8')
# msg_json = json.load(file)
# generate_nools(msg_json)