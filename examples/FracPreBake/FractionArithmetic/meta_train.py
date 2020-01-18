import json
import random
import subprocess

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


def powerset(iterable: Iterable):
    s = list(iterable)
    return chain.from_iterable(combinations(s, r) for r in range(len(s) + 1))


def dummy_eval():
    return random.uniform(0, 1)


skills = ["click_done", "check",
          "equal",
          "update_answer", "update_convert", "add",
          "multiply"]


space = {
    # "prior_skills": hp.choice("prior_skills", list(powerset(skills))),
    "prior_skills": skills,
    "epsilon": hp.uniform("epsilon", 0, 1),
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
                {"question_file": join_path(
                    problem_brds_relative, prob + ".brd")}
                for prob in problems
            ],
        }
    ]

    return {"training_set1": control}


gen_filename = "hyperopt_control.json"


def dump_training_json(control, filename=gen_filename):
    # from pprint import PrettyPrinter
    # pp = PrettyPrinter()
    # pp.pprint(control)
    with open(filename, "w") as out:
        json.dump(control, out)


def call_train():
    subprocess.run(["python3", "../../../train.py", gen_filename])


def per_agent_objective(args, agent=None, max_problems=None):
    if not agent:
        return dummy_eval()
    json = gen_control_for_agent(
        args, agent, sequences, max_problems=max_problems)
    dump_training_json(json)
    call_train()
    return dummy_eval()


if __name__ == "__main__":
    sequences = get_sequences()
    for agent in sequences:
        agent_objective = partial(
            per_agent_objective, agent=agent, max_problems=1)
        best = fmin(agent_objective, space, algo=tpe.suggest, max_evals=10)
        print(best)
        break
