import glob

set_template = '{ \n \
	"training_set1" : [ \n\
	%s \n\
	] \n\
	} \n'
agent_template = '\t\t {"agent_name":"%s", \n \
		"agent_type":"WhereWhenHowNoFoa", \n \
		"output_dir":"out/myAgent1", \n \
		"problem_set" : [ \n\
			{"set_params" : \n\
				{"HTML": "HTML/fraction_arithmetic.html", \n\
				"examples_only" : false} \n\
			}, \n\
		 \n %s \n  \
		\t] \n \
		}'
		

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

