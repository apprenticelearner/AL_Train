import argparse
import csv, json, random
from os import listdir, getcwd
from os.path import join as join_path ,relpath, dirname, isfile
from isomorphic import mass_produce, gen_as, gen_ad, gen_m


MAX_DEN = 12
def gen_problem_tables(table_dir, problem_count):
    table_filename_template = table_dir + '/{}_table.txt'
    as_count, ad_count, m_count = problem_count

    as_filename = table_filename_template.format('AS')
    gen_as(as_filename, MAX_DEN, as_count)

    ad_filename = table_filename_template.format('AD')
    gen_ad(ad_filename, MAX_DEN, ad_count)

    m_filename = table_filename_template.format('M')
    gen_m(m_filename, MAX_DEN, m_count)

    return as_filename, ad_filename, m_filename


def gen_brds_via_mass_production(table_files, brds_dir, mass_production_dir):
    as_filename, ad_filename, m_filename = table_files

    if as_filename:
        mass_produce(as_filename, mass_production_dir + '/AS_template.brd', brds_dir)
    if ad_filename:
        mass_produce(ad_filename, mass_production_dir + '/AD_template.brd', brds_dir)
    if m_filename:
        mass_produce(m_filename, mass_production_dir + '/M_template.brd', brds_dir)


def gen_single_agent_training_json(agent_type, problems, outfile, agent_name="FooBar"):
    # problems = [(brds, html), (brds, html)]
    def gen_problem_set_json(brds_dir, html):
        filenames = listdir(brds_dir)
        random.shuffle(filenames)
        params = [{"set_params": { "HTML": html, "examples_only": False }}]
        questions = [{'question_file': join_path('..', brds_dir, filename)}
                     for filename in filenames
                     ]
        return params + questions

    problem_set = [gen_problem_set_json(brds_dir, html) for brds_dir, html in problems]
    problem_set = [e for sl in problem_set for e in sl] # flatten
    data = {
        'agent_name': agent_name,
        'agent_type': agent_type,
        "stay_active": True,
        "dont_save": True,
        "no_ops_parse" : True,
        "args": {
            "when_learner": "trestle",
            "where_learner": "MostSpecific",
            "planner" : "fo_planner"
        },
        "feature_set" : ["equals"],
        "function_set" : ["add", "subtract", "multiply", "divide"],
        # 'output_dir': join_path(output_root, 'control', agent),
        'problem_set': problem_set
    }

    training_set = {'training_set1': [data]}
    with open(outfile, 'w') as out:
        json.dump(training_set, out)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='A utility to generate training jsons')
    parser.add_argument('-agent_type',
                        choices=['WhereWhenHowNoFoa', 'RLAgent','ModularAgent', 'QlearnerAgent'],
                        default='ModularAgent',
                        help="The type of agent to set in the training.json")
    parser.add_argument('-output_root',
                        default='out',
                        help="The root directory to use for output_dir in the agent specfications.")
    parser.add_argument('-outfile',
                        default='training.json',
                        help="")
    parser.add_argument('-problem_html',
                        default='FractionArithmetic/HTML/fraction_arithmetic.html',
                        help="The HTML file to use for the standard problems.")
    parser.add_argument('-mass_production_templates_dir',
                        default='mass_production',
                        help="The directory location of AS, AD, and M brd templates.")

    args = parser.parse_args()
    problem_count = (50, 50, 50)

    # 1. Generate problems
    table_dir = args.output_root + '/tables'
    table_files = gen_problem_tables(table_dir, problem_count)

    # 2. Generate brds
    brds_dir = args.output_root + '/brds'
    gen_brds_via_mass_production(table_files, brds_dir, args.mass_production_templates_dir)

    # 3. Generate training.json
    # outfile = '{}/{}'.format(args.output_root, args.outfile)
    outfile = args.outfile
    problems = [(brds_dir, args.problem_html)]
    gen_single_agent_training_json(args.agent_type, problems, outfile)
