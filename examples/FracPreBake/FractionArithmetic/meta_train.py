import sys
import json
import random
import subprocess
import argparse
from pprint import pprint

from operator import itemgetter
from functools import partial
from typing import Iterable
from itertools import chain, combinations
from os.path import join as join_path
from hyperopt import hp
from hyperopt import fmin, tpe

from examples.FracPreBake.FractionArithmetic.gen_training import (
    parse_file,
    get_problem_orders,
)

dic = {'hint': 'hint', 'done': 'done', 'JCommTable4.R0C0': 'num3', 'JCommTable4.R1C0': 'den3', 'JCommTable5.R0C0': 'num4', 'JCommTable5.R1C0': 'den4',
       'JCommTable6.R0C0': 'num5', 'JCommTable6.R1C0': 'den5', 'JCommTable8.R0C0': 'check_convert', 'checkBoxGroup': 'check_convert'}
dic2 = {'num3': 'num5', 'den3': 'den5'}


def get_first_attempt_correctness(transactions):
    data = [r for r in transactions]

    for d in data:
        if d['Time'].isnumeric():
            d['Time'] = int(d['Time'])

    # This comes from never trusting the order of a datashop transaction file
    # but its probably unnecessary
    data.sort(key=itemgetter('Anon Student Id', 'Time'))
    if len(data) < 200:
        print(data)

    hint = False

    correctness = {}

    for d in data:
        if ('Level (ProblemSet)' in d and
            d['Level (ProblemSet)'].lower() in ('pretest', 'midtest a',
                                                'midtest b', 'posttest',
                                                'dposttest')):
            continue

        ptype = d['Problem Name'].split()[0]

        if d['Selection'] in dic:
            d['Selection'] = dic[d['Selection']]
        elif ptype in ['AS', 'MD', 'MS'] and d['Selection'] in dic2:
            d['Selection'] = dic2[d['Selection']]

        if "MD " in d['Problem Name']:
            d['Problem Name'] = d['Problem Name'].replace("MD ", 'M ')
        if "MS " in d['Problem Name']:
            d['Problem Name'] = d['Problem Name'].replace("MS ", 'M ')
        if "AD " in d['Problem Name']:
            d['Problem Name'] = d['Problem Name'].replace("AD ", 'A ')
        if "AS " in d['Problem Name']:
            d['Problem Name'] = d['Problem Name'].replace("AS ", 'A ')

        student = d['Anon Student Id']
        if student not in correctness:
            correctness[student] = {}

        problem = d['Problem Name']
        if problem not in correctness[student]:
            correctness[student][problem] = {}

        step = d['Selection']
        prev_hint = hint

        if d['Outcome'] == 'HINT':
            hint = True
            continue
        else:
            hint = False

        if step not in correctness[student][problem] and not prev_hint:
            correctness[student][problem][step] = d['Outcome']
        if step not in correctness[student][problem] and prev_hint:
            correctness[student][problem][step] = 'INCORRECT'

    for student in correctness:
        for problem in correctness[student]:
            if 'check_convert' not in correctness[student][problem]:
                correctness[student][problem]['check_convert'] = "CORRECT"

    return correctness


def powerset(iterable: Iterable):
    s = list(iterable)
    return chain.from_iterable(combinations(s, r) for r in range(len(s) + 1))


def call_eval(human_correctness, agent_file, agent):
    agent_ts = parse_file(agent_file)
    agent_correctness = get_first_attempt_correctness(agent_ts)
    agent_id = list(agent_correctness)[0]

    sim = agent_correctness[agent_id]
    human = human_correctness[agent]

    print(list(sim))
    print(sim)
    print(list(human))

    error = []

    for problem in sim:
        if problem not in human:
            continue

        print()
        print('sim')
        print(sim[problem])
        print('human')
        print(human[problem])

        for step in set(list(sim[problem]) + list(human[problem])):
            if step not in sim[problem]:
                error.append(1)
            elif step not in human[problem]:
                error.append(1)
            elif (sim[problem][step] == 'CORRECT' and
                  human[problem][step] == "CORRECT"):
                error.append(0)
            elif (sim[problem][step] != 'CORRECT' and
                  human[problem][step] != "CORRECT"):
                error.append(0)
            else:
                error.append(1)

    print(error)
    print("ERROR", sum(error))
    print("ERROR RATE", sum(error) / len(error))
    return sum(error)


skills = [# "click_done",
          # "check",
          # "equal",
          # "update_answer", "update_convert",
          # "add",
          # "multiply"
          'correct_multiply_num',
          'correct_multiply_denom',
          'correct_done',
          'correct_add_same_num',
          'correct_copy_same_denom',
          'correct_check',
          'correct_convert_num1',
          'correct_convert_num2',
          'correct_convert_denom1',
          'correct_convert_denom2',
          'correct_add_convert_num',
          'correct_copy_convert_denom'
          ]


space = {
    # "prior_skills": hp.choice("prior_skills", list(powerset(skills))),
    "prior_skills": skills,
    "request_epsilon": hp.uniform("request_epsilon", 0.01, 0.99),
    "train_epsilon": hp.uniform("train_epsilon", 0.01, 0.99),
    "action_penalty": hp.uniform('action_penalty', -1, 0)
}


def get_sequences(transaction_file="./ds_1190_Study2_sorted_cleaned.csv"):
    return get_problem_orders(parse_file(transaction_file))


def gen_control_for_agent(
    agent_args,
    agent,
    sequences,
    problem_brds_relative="../mass_production/mass_production_brds/",
    problem_html="HTML/fraction_arithmetic.html",
    agent_type="SoartechAgent",
    max_problems=None
):
    problems = []
    if max_problems:
        problems = sequences[agent][:max_problems]
    else:
        problems = sequences[agent]

    control = [
        {
            "agent_name": agent,
            "agent_type": agent_type,
            "stay_active": True,
            "dont_save": True,
            "no_ops_parse": True,
            "args": agent_args,
            "feature_set": [],
            "function_set": [],
            # 'output_dir': join_path(output_root, 'control', agent),
            "problem_set": [
                {"set_params": {"HTML": problem_html, "examples_only": False}}
            ]
            + [
                {"question_file": join_path(
                    problem_brds_relative, prob + ".brd")}
                for prob in problems
            ],
        }
    ]

    return {"training_set1": control}


gen_filename = "hyperopt.json"


def dump_training_json(control, filename=gen_filename):
    # from pprint import PrettyPrinter
    # pp = PrettyPrinter()
    # pp.pprint(control)
    with open(filename, "w") as out:
        json.dump(control, out)


counter = 0


def call_train():
    global counter
    counter += 1
    agent_file = 'log/' + 'hyperopt%i.txt' % counter

    subprocess.run(["python3", "../../../train.py", gen_filename,
                    "-o", agent_file,
                    # "-l", './log'
                    ])

    return agent_file
    # subprocess.run(["python3 ../../../train.py " + gen_filename +
    #                 # "-o", agent_file,
    #                 "-l ./log"], shell=True)


def per_agent_objective(args, transaction_file, human_correctness, agent=None, max_problems=None):
    # if not agent:
    #     return dummy_eval()
    json = gen_control_for_agent(
        args, agent, sequences, max_problems=max_problems)
    dump_training_json(json)
    agent_file = call_train()
    return call_eval(human_correctness, agent_file, agent)


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description='Individualize model using repeated training and hyperparameter tuning.')
    parser.add_argument('transaction_file', type=str, metavar="<training_file>.csv",
                        help="DataShop transaction_file file to train from / compare to.")
    try:
        args = parser.parse_args(argv)
        # args.setattr(args, "training", args.training[0]) # dunno why it comes in a list

    except Exception:
        parser.print_usage()
        sys.exit()

    return args


if __name__ == "__main__":
    # args = parse_args(sys.argv[1:])
    # print(args)
    # transaction_file = args.transaction_file
    transaction_file = "ds_1190_Study2_sorted_cleaned.csv"
    sequences = get_sequences(transaction_file)
    human_ts = parse_file(transaction_file)
    human_correctness = get_first_attempt_correctness(human_ts)
    for agent in sequences:
        agent_objective = partial(
            per_agent_objective, transaction_file=transaction_file,
            human_correctness=human_correctness,
            agent=agent, max_problems=1)
        best = fmin(agent_objective, space, algo=tpe.suggest, max_evals=5)
        print(best)
        break
