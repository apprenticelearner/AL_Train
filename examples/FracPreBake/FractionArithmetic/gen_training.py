import argparse
import csv
import json
from operator import itemgetter
from os.path import join as join_path


def parse_file(filename):
    reader = csv.DictReader(filename)
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
            if len(sequences) > 10:
                break
        if d['Problem Name'][0] == 'T':
            continue
        sequences[d['Anon Student Id']].append(d['Problem Name'])
    return sequences


def gen_training(transactions,
                 agent_type="WhereWhenHowNoFoa",
                 output_root="out",
                 problem_brds='converted_brds/',
                 problem_html="FractionArithmetic/HTML/fraction_arithmetic.html",
                 prepost_brds="mass_production/mass_production_brds/",
                 prepost_html="mass_production/HTML/pretest.html",
                 num_pretest=8):

    sequences = get_problem_orders(transactions)

    control = [{'agent_name': 'Control_' + agent,
                'agent_type': agent_type,
                'output_dir': join_path(output_root, 'control', agent),
                'problem_set':
                    [{"set_params": {"HTML": problem_html,
                                     "examples_only": False}}] +
                    [{'question_file': join_path(problem_brds, prob + '.brd')}
                     for prob in sequences[agent]]}
               for agent in sequences]

    control = {'training_set1': control}
    with open('control_training.json', 'w') as out:
        json.dump(control, out)

    pre_test = [{'agent_name': 'Pretest_' + agent,
                 'agent_type': agent_type,
                 'output_dir': join_path(output_root, 'pretest', agent),
                 'problem_set':
                     [{"set_params": {"HTML": prepost_html,
                                      "examples_only": True}}] +
                     [{'question_file': join_path(prepost_brds,
                                                  '_'.join(agent, 'Pretest',
                                                           str(i + 1)))}
                      for i in range(num_pretest)] +
                     [{"set_params": {"HTML": problem_html,
                                      "examples_only": False}}] +
                     [{'question_file': join_path(problem_brds, prob + '.brd')}
                      for prob in sequences[agent]]}
                for agent in sequences]
    pre_test = {'training_set1': pre_test}
    with open('pretest_training.json', 'w') as out:
        json.dump(pre_test, out)


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
    parser.add_argument('-subset_brds',
                        default='IntegerArithmetic/brds/',
                        help="The directory location of the brds for the"
                             "relevant substep problems. I don't currently use"
                             "this yet.")
    parser.add_argument('-subset_html',
                        default='IntegerArithmetic/HTML/IntegerArithmetic.html',
                        help="The HTML file to use for the relevant substep"
                             "problems. I don't currently use this yet.")

    args = parser.parse_args()
    data = parse_file(args.trans_file)

    gen_training(data,
                 agent_type=args.agent_type,
                 output_root=args.output_root,
                 problem_brds=args.problem_brds,
                 problem_html=args.problem_html,
                 prepost_brds=args.prepost_brds,
                 prepost_html=args.prepost_html,
                 num_pretest=args.num_pretest)
