import glob

set_template = '{ \n \
	"training_set1" : [ \n\
	%s \n\
	] \n\
	} \n'
agent_template = ('\t\t {"agent_name":"%s", \n \
		"agent_type":"WhereWhenHowNoFoa", \n' + 
		'\t\t"stay_active": true, \n' +
		'\t\t"dont_save": true, \n' +
		'\t\t"args" : {\n' +
			'\t\t\t"when_learner": "trestle", \n' +
			'\t\t\t"where_learner": "MostSpecific" \n' +
			# '\t\t\t"where_learner": "stateresponselearner" \n' +
			# '\t\t\t"where_learner": "specifictogeneral" \n' +
			# '\t\t\t"where_learner": "relationallearner" \n' +
		'\t\t},\n' +
		# '"function_set": "tutor knowledge", \n' +
		# '"feature_set": "tutor knowledge", \n' +
		'\t\t"problem_set" : [ \n\
			{"set_params" : \n\
				{"HTML": "HTML/fraction_arithmetic.html", \n\
				"examples_only" : false} \n\
			}, \n\
		 \n %s \n  \
		\t] \n \
		}')

problem_template = '\t\t\t{"question_file" : \"%s\"}'
            # '\t\t\t{"HTML": \"%s\", \n \
            # '{"question_file" : \"%s\"}'
            # "examples_only" : %s}'



files = glob.glob("rony_training/Stu_*.txt")


agents = []
for i,f in enumerate(files):
    
    problem_set = []
    with open(f, 'r') as f_h:
        for brd in f_h:
            brd = "../" + brd.replace("brds","converted_brds").rstrip()
            problem = problem_template % (brd,)
            problem_set.append(problem)
    agent = agent_template % (f.replace(".txt", ""),",\n".join(problem_set))
    agents.append(agent)

with open('rony_training.json', 'w') as out:
    out.write(set_template % ",\n".join(agents))

# print(set_template % "\n".join(agents))

