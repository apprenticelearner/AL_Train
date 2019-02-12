from random import randint
import csv, os


def random_as(max_den, count=1):
    res = []
    for _ in range(count):
        den = randint(2, max_den)
        num1 = randint(1, den-1)
        num2 = randint(1, den-1)
        res.append((num1, num2, den, num1+num2))
    return res


def random_ad(max_den, count=1):
    res = []
    for _ in range(count):
        den1 = randint(2, max_den)
        den2 = randint(2, max_den)
        while(den1%den2 == 0 or den2%den1 == 0):
            den2 = randint(2, max_den)

        num1 = randint(1, den1-1)
        num2 = randint(1, den2-1)

        res_num1 = num1*den2
        res_num2 = num2*den1
        res.append((num1, den1, num2, den2, den1*den2, res_num1, res_num2, res_num1+res_num2))
    return res


def random_m(max_den, count=1):
    res = []
    for _ in range(count):
        den1 = randint(2, max_den)
        den2 = randint(2, max_den)
        num1 = randint(1, den1-1)
        num2 = randint(1, den2-1)
        res.append((num1, den1, num2, den2, num1*num2, den1*den2))
    return res


def gen_add(filename, max_num, count=1):
    if not os.path.exists(os.path.dirname(filename)):
        os.makedirs(os.path.dirname(filename))
    with open(filename, 'w+', newline='') as f:
        writer = csv.writer(f, delimiter='\t', quoting=csv.QUOTE_MINIMAL)
        data = [(randint(1, max_num), randint(1, max_num)) for _ in range(count)]
        get_problem_name = lambda d: ' {}_plus_{}'.format(d[0], d[1])
        out = [
            ['Problem Name'] + [get_problem_name(d) for d in data],
            ['%(left_operand)%'] + [d[0] for d in data],
            ['%(operator)%'] + ['+' for _ in data],
            ['%(right_operand)%'] + [d[1] for d in data],
            ['%(result)%'] + [d[0] + d[1] for d in data],
        ]
        for r in out:
            writer.writerow(r)


def gen_mul(filename, max_num, count=1):
    if not os.path.exists(os.path.dirname(filename)):
        os.makedirs(os.path.dirname(filename))
    with open(filename, 'w+', newline='') as f:
        writer = csv.writer(f, delimiter='\t', quoting=csv.QUOTE_MINIMAL)
        data = [(randint(1, max_num), randint(1, max_num)) for _ in range(count)]
        get_problem_name = lambda d: ' {}_times_{}'.format(d[0], d[1])
        out = [
            ['Problem Name'] + [get_problem_name(d) for d in data],
            ['%(left_operand)%'] + [d[0] for d in data],
            ['%(operator)%'] + ['*' for _ in data],
            ['%(right_operand)%'] + [d[1] for d in data],
            ['%(result)%'] + [d[0] + d[1] for d in data],
        ]
        for r in out:
            writer.writerow(r)


def gen_as(filename, max_den, count=1):
    data = random_as(max_den, count)
    if not os.path.exists(os.path.dirname(filename)):
        os.makedirs(os.path.dirname(filename))
    with open(filename, 'w+', newline='') as f:
        writer = csv.writer(f, delimiter='\t', quoting=csv.QUOTE_MINIMAL)
        get_problem_name = lambda d: 'AS {}_{}_plus_{}_{}'.format(d[0], d[2], d[1], d[2])
        out = [
            ['Problem Name'] + [get_problem_name(d) for d in data],
            ['%(startStateNodeName)%'] + ['' for _ in data],
            ['%(left_numerator)%'] + [d[0] for d in data],
            ['%(denominator)%'] + [d[2] for d in data],
            ['%(right_numerator)%'] + [d[1] for d in data],
            ['%(operator)%'] + ['+' for _ in data],
            ['%(result_numerator)%'] + [d[3] for d in data],
        ]

        for r in out:
            writer.writerow(r)


def gen_ad(filename, max_den, count=1):
    data = random_ad(max_den, count)
    if not os.path.exists(os.path.dirname(filename)):
        os.makedirs(os.path.dirname(filename))
    with open(filename, 'w+', newline='') as f: 
        writer = csv.writer(f, delimiter='\t', quoting=csv.QUOTE_MINIMAL)
        get_problem_name = lambda d: 'AD {}_{}_plus_{}_{}'.format(d[0], d[1], d[2], d[3])
        out = [
            ['Problem Name'] + [get_problem_name(d) for d in data],
            ['%(startStateNodeName)%'] + ['' for _ in data],
            ['%(left_numerator)%'] + [d[0] for d in data],
            ['%(left_denominator)%'] + [d[1] for d in data],
            ['%(right_numerator)%'] + [d[2] for d in data],
            ['%(right_denominator)%'] + [d[3] for d in data],
            ['%(operator)%'] + ['+' for _ in data],
            ['%(convert)%'] + ['x' for _ in data],
            ['%(result_denominator)%'] + [d[4] for d in data],
            ['%(left_numerator_new)%'] + [d[5] for d in data],
            ['%(right_numerator_new)%'] + [d[6] for d in data],
            ['%(result_numerator)%'] + [d[7] for d in data],
        ]

        for r in out:
            writer.writerow(r)


def gen_m(filename, max_den, count=1):
    data = random_ad(max_den, count)
    if not os.path.exists(os.path.dirname(filename)):
        os.makedirs(os.path.dirname(filename))
    with open(filename, 'w+', newline='') as f:
        writer = csv.writer(f, delimiter='\t', quoting=csv.QUOTE_MINIMAL)
        get_problem_name = lambda d: 'M {}_{}_times_{}_{}'.format(d[0], d[1], d[2], d[3])
        out = [
            ['Problem Name'] + [get_problem_name(d) for d in data],
            ['%(startStateNodeName)%'] + ['' for _ in data],
            ['%(left_numerator)%'] + [d[0] for d in data],
            ['%(left_denominator)%'] + [d[1] for d in data],
            ['%(right_numerator)%'] + [d[2] for d in data],
            ['%(right_denominator)%'] + [d[3] for d in data],
            ['%(operator)%'] + ['*' for _ in data],
            ['%(result_numerator)%'] + [d[4] for d in data],
            ['%(result_denominator)%'] + [d[5] for d in data],
        ]
        for r in out:
            writer.writerow(r)

def mass_produce(table_file, template_file, dest_dir):
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
    with open(table_file, newline='') as tbf:
        reader = csv.reader(tbf, delimiter='\t')
        keys = []
        data = None
        for row in reader:
            if not data: 
                data = [[] for _ in row[1:]]
            keys.append(row[0])
            for index, r in enumerate(row[1:]):
                data[index].append(r)
        with open(template_file, 'r') as tpf:
            template = tpf.read()
            for d in data:
                instance = template
                problem_name = d[0]
                for index, v in enumerate(d[1:]): # ignore problem name.
                    instance = instance.replace(keys[index+1], v)

                with open('{}/{}.brd'.format(dest_dir, problem_name), 'w+') as dest:
                    dest.write(instance)


def get_piks(model_file):
    kc_models = []
    with open (model_file, 'r') as f:
        content = f.read()
        kc_text = content[content.find('KC Name'): content.find('\n\n', content.find('KC Name'))].splitlines()
        kc_values = list(csv.DictReader(kc_text[1:], kc_text[0].split('\t'), delimiter='\t'))
        student_text = content[content.find('Anon Student Id'): content.find('\n\n', content.find('Anon Student Id'))].splitlines()
        student_values = csv.DictReader(student_text[1:], student_text[0].split('\t'), delimiter='\t')
        piks = []
        for s in student_values:
            intercept = s['Intercept']
            student_piks = {
                'student_id': s['Anon Student Id'],
                'student_intercept': intercept,
                'piks': {}
            }
            for kc in kc_values:
                student_piks['piks'][kc['KC Name']] = float(intercept) / float(kc['Slope'])

            piks.append(student_piks)

        return piks


def process_piks(piks):
    kcs = piks[0]['piks'].keys()
    for kc in kcs:
        min_value = min([s['piks'][kc] for s in piks])
        for s in piks:
            s['piks'][kc] = round(s['piks'][kc] - min_value)

    kcs_by_problem_type = {}
    for kc in kcs:
        problem_type = kc.split()[0]
        if problem_type not in kcs_by_problem_type:
            kcs_by_problem_type[problem_type] = []

        kcs_by_problem_type[problem_type].append(kc)
        
    for s in piks:
        s['final_piks'] = {}
        for problem_type, ptkcs in kcs_by_problem_type.items():
            s['final_piks'][problem_type] = min([s['piks'][kc] for kc in ptkcs])


    return kcs_by_problem_type.keys(), piks
    # return piks


MAX_DEN = 12
def gen_iso_brds(model_file, iso_dir, mass_production_dir):
    table_filename_template = iso_dir + '{}/tables/{}_table.txt'
    brds_destdir_template = iso_dir + '{}/brds'
    piks = get_piks(model_file)
    problem_types, piks = process_piks(piks)
    for s in piks:
        brds_destdir = brds_destdir_template.format(s['student_id'])

        as_filename = table_filename_template.format(s['student_id'], 'AS')
        gen_as(as_filename, MAX_DEN, s['final_piks']['AS'])
        mass_produce(as_filename, mass_production_dir + 'AS_template.brd', brds_destdir)

        ad_filename = table_filename_template.format(s['student_id'], 'AD')
        gen_ad(ad_filename, MAX_DEN, s['final_piks']['AD'])
        mass_produce(ad_filename, mass_production_dir + 'AD_template.brd', brds_destdir)

        m_filename = table_filename_template.format(s['student_id'], 'M')
        gen_m(m_filename, MAX_DEN, s['final_piks']['M'])
        mass_produce(m_filename, mass_production_dir + 'M_template.brd', brds_destdir)
        

def gen_substep_brds(model_file, substep_dir, mass_production_template):
    table_filename_template = substep_dir + '{}/tables/{}_table.txt'
    brds_destdir_template = substep_dir + '{}/brds'
    piks = get_piks(model_file)
    problem_types, piks = process_piks(piks)
    for s in piks:
        brds_destdir = brds_destdir_template.format(s['student_id'])

        add_filename = table_filename_template.format(s['student_id'], 'add')
        gen_add(add_filename, MAX_DEN, s['final_piks']['AS'])
        mass_produce(add_filename, mass_production_template, brds_destdir)

        mul_filename = table_filename_template.format(s['student_id'], 'mul')
        gen_mul(mul_filename, MAX_DEN, s['final_piks']['M'])
        mass_produce(mul_filename, mass_production_template, brds_destdir)
