import json
import os
import random
import subprocess

from itertools import chain, combinations
from os.path import join as join_path
from typing import Iterable
from hyperopt import hp

from examples.FracPreBake.FractionArithmetic.gen_training import (
    gen_training,
    parse_file,
    get_problem_orders,
)
from train import main, parse_args


def powerset(iterable: Iterable):
    s = list(iterable)
    return chain.from_iterable(combinations(s, r) for r in range(len(s) + 1))


def dummy_eval():
    return random.uniform(0, 1)


skills = ["click_done", "check", "update", "add", "multiply"]


space = {
    "prior_skills": hp.choice("prior_skills", list(powerset(skills))),
    "epsilon": hp.uniform("epsilon", 0, 1),
}


def gen_control_training(
    agent_args,
    transaction_file="./ds_1190_Study2_sorted_cleaned.csv",
    problem_html="HTML/fraction_arithmetic.html",
    problem_brds_relative="../mass_production/mass_production_brds/",
    agent_type="SoartechAgent",
):
    sequences = get_problem_orders(parse_file(transaction_file))

    control = [
        {
            "agent_name": "Control_" + agent,
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
                {"question_file": join_path(problem_brds_relative, prob + ".brd")}
                for prob in sequences[agent]
            ],
        }
        for agent in sequences
    ]

    return {"training_set1": control}


gen_filename = 'hyperopt_control.json'


def dump_training_json(control, filename=gen_filename):
    with open(filename, "w") as out:
        json.dump(control, out)


def call_train():
    wd = os.getcwd()
    print(wd)
    subprocess.run(["python3", "../../../train.py", gen_filename])




def objective(args):
    print(args)
    training_json = gen_control_training(args)
    dump_training_json(training_json)
    call_train()
    return dummy_eval()

import hyperopt.pyll.stochastic

#x = gen_control_training(hyperopt.pyll.stochastic.sample(space))
#from pprint import PrettyPrinter

#pp = PrettyPrinter()
#pp.pprint(x)

from hyperopt import fmin, tpe, space_eval
best = fmin(objective, space, algo=tpe.suggest, max_evals=1)
print(best)
print(space_eval(best))
