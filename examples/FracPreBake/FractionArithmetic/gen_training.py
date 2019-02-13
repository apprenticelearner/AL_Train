import argparse
import csv
import json
from operator import itemgetter
from os import listdir, getcwd
from os.path import join as join_path
from os.path import relpath,dirname, isfile
from isomorphic import gen_iso_brds, gen_substep_brds


def parse_file(filename):
    with open(filename) as f:
        reader = csv.DictReader(f, delimiter='\t')
        return [r for r in reader]


def get_problem_orders(transactions):
    data = [r for r in transactions]

    # This comes from never trusting the order of a datashop transaction file
    # but its probably unnecessary
    data.sort(key=itemgetter('Anon Student Id', 'Time'))
    subset = {}

    for d in data:
        k = (d['Anon Student Id'], d['Problem Name'])
        subset[k] = d
    data = [subset[k] for k in subset]
    data.sort(key=itemgetter('Anon Student Id', 'Time'))

    sequences = {}
    for d in data:
        if d['Anon Student Id'] not in sequences:
            sequences[d['Anon Student Id']] = []
        if d['Level (ProblemSet)'].lower() in ('pretest', 'midtest a',
                                               'midtest b', 'posttest',
                                               'dposttest'):
            continue
        if d['Problem Name'][0] == 'M':
            # TODO - does this break?
            d['Problem Name'] = 'M' + d['Problem Name'][2:]
        if d['Problem Name'][0] == 'T' or \
           d['Problem Name'] == 'InstructionSlide':
            continue
        sequences[d['Anon Student Id']].append(d['Problem Name'])
    return sequences


def gen_training(transactions,
                 agent_type="WhereWhenHowNoFoa",
                 output_root="out",
                 problem_brds='converted_brds/',
                 problem_brds_relative='converted_brds/',
                 problem_html="FractionArithmetic/HTML/fraction_arithmetic.html",
                 prepost_brds="mass_production/mass_production_brds/",
                 prepost_brds_relative="mass_production/mass_production_brds/",
                 prepost_html="mass_production/HTML/pretest.html",
                 num_pretest=8,
                 iso_brds="iso",
                 substep_brds="substep", 
                 substep_html="IntegerArithmetic/HTML/IntegerArithmetic.html"):

    sequences = get_problem_orders(transactions)

    control = [{'agent_name': 'Control_' + agent,
                'agent_type': agent_type,

                "stay_active": True, 
                "dont_save": True, 
                "args" : {
                    "when_learner": "trestle",
                    "where_learner": "MostSpecific" 
                },

                # 'output_dir': join_path(output_root, 'control', agent),
                'problem_set':
                    [{"set_params": {"HTML": problem_html,
                                     "examples_only": False}}] +
                    [{'question_file': join_path(problem_brds_relative, prob + '.brd')}
                     for prob in sequences[agent]]}
               for agent in sequences]

    control = {'training_set1': control}
    with open('control_training.json', 'w') as out:
        json.dump(control, out)

    pre_test = []
    for agent in sequences:
        agent_pre_test = {'agent_name': 'Pretest_' + agent,
                     'agent_type': agent_type,

                    "stay_active": True, 
                    "dont_save": True, 
                    "args" : {
                        "when_learner": "trestle",
                        "where_learner": "MostSpecific" 
                    }}
        agent_pre_test["problem_set"] = []
        agent_pre_test["problem_set"] +=  [{"set_params": {"HTML": prepost_html, "examples_only": True}}]
        for i in range(num_pretest):
            pretest_path = join_path(prepost_brds_relative,'_'.join((agent, 'Pretest', str(i + 1))) + '.brd')
            thiswd_pretestpath = join_path(prepost_brds,'_'.join((agent, 'Pretest', str(i + 1))) + '.brd')
            if(isfile(thiswd_pretestpath)):
                agent_pre_test["problem_set"] += [{'question_file': pretest_path}]
            else:
                print("Skip:", thiswd_pretestpath)
        
        agent_pre_test["problem_set"] += [{"set_params": {"HTML": problem_html,"examples_only": False}}] 
        agent_pre_test["problem_set"] += [{'question_file': join_path(problem_brds_relative, prob + '.brd')} for prob in sequences[agent]]                                      
        pre_test.append(agent_pre_test)
            # [{'question_file': join_path(prepost_brds,
            #                                       '}
            #           for i in range(num_pretest) if (isfile(join_path(prepost_brds,
            #                                       '_'.join((agent, 'Pretest',
            #                                                str(i + 1))) + '.brd')))] +

                 # 'output_dir': join_path(output_root, 'pretest', agent),


                 # 'problem_set':
                 #      +
    # pre_test = []

                     
                     
                # for agent in sequences]
    pre_test = {'training_set1': pre_test}
    with open('pretest_training.json', 'w') as out:
        json.dump(pre_test, out)


    student_ids = [n for n in listdir(iso_brds)]
    overlapped_student_ids = [s for s in sequences if s in student_ids]
    isomorphic = [{'agent_name': 'Iso_' + agent,
                 'agent_type': agent_type,

                "stay_active": True, 
                "dont_save": True, 
                "args" : {
                    "when_learner": "trestle",
                    "where_learner": "MostSpecific" 
                },

                 'problem_set':
                     [{"set_params": {"HTML": problem_html,
                                      "examples_only": True}}] +
                     [{'question_file': join_path(iso_brds, agent, 'brds', n)}
                      for n in listdir(join_path(iso_brds, agent, 'brds'))] +
                     [{"set_params": {"HTML": problem_html,
                                      "examples_only": False}}] +
                     [{'question_file': join_path(problem_brds_relative, prob + '.brd')}
                      for prob in sequences[agent]]}
                for agent in overlapped_student_ids]
    isomorphic = {'training_set1': isomorphic}
    with open('iso_training.json', 'w') as out:
        json.dump(isomorphic, out)

    substep = [{'agent_name': 'Substep_' + agent,
                 'agent_type': agent_type,

                "stay_active": True, 
                "dont_save": True, 
                "args" : {
                    "when_learner": "trestle",
                    "where_learner": "MostSpecific" 
                },

                 'problem_set':
                     [{"set_params": {"HTML": substep_html,
                                      "examples_only": True}}] +
                     [{'question_file': join_path(substep_brds, agent, 'brds', n)}
                      for n in listdir(join_path(substep_brds, agent, 'brds'))] +
                     [{"set_params": {"HTML": problem_html,
                                      "examples_only": False}}] +
                     [{'question_file': join_path(problem_brds, prob + '.brd')}
                      for prob in sequences[agent]]}
                for agent in overlapped_student_ids]
    substep = {'training_set1': substep}
    with open('substep_training.json', 'w') as out:
        json.dump(substep, out)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='A utility to generate training jsons based on datashop'
                    'transaction files.')
    parser.add_argument('-trans_file',
                        help="The datashop transaction file to use.")
    parser.add_argument('-agent_type',
                        choices=['WhereWhenHowNoFoa', 'RLAgent'],
                        default='WhereWhenHowNoFoa',
                        help="The type of agent to set in the training.json")
    parser.add_argument('-output_root',
                        default='out',
                        help="The root directory to use for output_dir in the"
                             "agent specfications.")
    parser.add_argument('-problem_brds',
                        default='converted_brds/',
                        help="The directory location of the brd files for the"
                             "standard problem set.")
    parser.add_argument('-problem_html',
                        default='FractionArithmetic/HTML/fraction_arithmetic.html',
                        help="The HTML file to use for the standard problems.")
    parser.add_argument('-prepost_brds',
                        default='mass_production/mass_production_brds/',
                        help="The directory location of the individualized "
                             "pre-post test brds")
    parser.add_argument('-prepost_html',
                        default='mass_production/HTML/pretest.html',
                        help="The HTML file to use for the pre-post problems.")
    parser.add_argument('-num_pretest',
                        type=int,
                        default=8,
                        help="The number of pretest items to add to the"
                             "burn-in training")
    parser.add_argument('-model_file',
                        help="The datashop model value file to use.")
    parser.add_argument('-iso_brds',
                        default='iso/',
                        help="The directory location of brds for isomorphic problems for each student.")
    parser.add_argument('-iso_mass_production_templates',
                        default='mass_production/',
                        help="The directory location of AS, AD, and M brd templates.")
    parser.add_argument('-substep_brds',
                        default='substep/',
                        help="The directory location of brds for sustep problems for each student.")
    parser.add_argument('-substep_mass_production_template',
                        default='../IntegerArithmetic/IntegerArithmetic.brd',
                        help="The mass production template for substep problems")
    parser.add_argument('-substep_html',
                        default='IntegerArithmetic/HTML/IntegerArithmetic.html',
                        help="The HTML file to use for the relevant substep"
                             "problems. I don't currently use this yet.")

    args = parser.parse_args()
    data = parse_file(args.trans_file)

    # args.problem_brds = relpath(args.problem_brds ,start=dirname(args.problem_html))
    # args.prepost_brds = relpath(args.prepost_brds ,start=dirname(args.prepost_html))

    gen_iso_brds(args.model_file, args.iso_brds, args.iso_mass_production_templates)
    gen_substep_brds(args.model_file, args.substep_brds, args.substep_mass_production_template)
    gen_training(data,
                 agent_type=args.agent_type,
                 output_root=args.output_root,
                 problem_brds=args.problem_brds,
                 problem_brds_relative=relpath(args.problem_brds ,start=dirname(args.problem_html)),
                 problem_html=args.problem_html,
                 prepost_brds=args.prepost_brds,
                 prepost_brds_relative=relpath(args.prepost_brds ,start=dirname(args.prepost_html)),
                 prepost_html=args.prepost_html,
                 num_pretest=args.num_pretest,
                 iso_brds=args.iso_brds,
                 substep_brds=args.substep_brds,
                 substep_html=args.substep_html,
    )

