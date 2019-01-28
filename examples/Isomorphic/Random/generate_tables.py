from random import randint
import csv


def gen_as(filename, max_den, count=1):
    data = random_as(max_den, count)
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f, delimiter='\t', quoting=csv.QUOTE_MINIMAL)

        get_problem_name = lambda d: 'AS {}_{}_plus_{}_{}'.format(d[0], d[2], d[1], d[2])
        writer.writerow(['Problem Name'] + [get_problem_name(d) for d in data])
        writer.writerow(['%(startStateNodeName)%'] + ['' for _ in data])
        writer.writerow(['%(left_numerator)%'] + [d[0] for d in data])
        writer.writerow(['%(denominator)%'] + [d[2] for d in data])
        writer.writerow(['%(right_numerator)%'] + [d[1] for d in data])
        writer.writerow(['%(operator)%'] + ['+' for _ in data])
        writer.writerow(['%(result_numerator)%'] + [d[3] for d in data])


def gen_ad(filename max_den, count=1):
    data = random_ad(max_den, count)
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f, delimiter='\t', quoting=csv.QUOTE_MINIMAL)

        get_problem_name = lambda d: 'AD {}_{}_plus_{}_{}'.format(d[0], d[1], d[2], d[3])
        writer.writerow(['Problem Name'] + [get_problem_name(d) for d in data])
        writer.writerow(['%(startStateNodeName)%'] + ['' for _ in data])
        writer.writerow(['%(left_numerator)%'] + [d[0] for d in data])
        writer.writerow(['%(left_denominator)%'] + [d[1] for d in data])
        writer.writerow(['%(right_numerator)%'] + [d[2] for d in data])
        writer.writerow(['%(right_denominator)%'] + [d[3] for d in data])
        writer.writerow(['%(operator)%'] + ['+' for _ in data])
        writer.writerow(['%(convert)%'] + ['x' for _ in data])
        writer.writerow(['%(result_denominator)%'] + [d[4] for d in data])
        writer.writerow(['%(left_numerator_new)%'] + [d[5] for d in data])
        writer.writerow(['%(right_numerator_new)%'] + [d[6] for d in data])
        writer.writerow(['%(result_numerator)%'] + [d[7] for d in data])


def gen_m(filename max_den, count=1):
    data = random_ad(max_den, count)
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f, delimiter='\t', quoting=csv.QUOTE_MINIMAL)

        get_problem_name = lambda d: 'M {}_{}_times_{}_{}'.format(d[0], d[1], d[2], d[3])
        writer.writerow(['Problem Name'] + [get_problem_name(d) for d in data])
        writer.writerow(['%(startStateNodeName)%'] + ['' for _ in data])
        writer.writerow(['%(left_numerator)%'] + [d[0] for d in data])
        writer.writerow(['%(left_denominator)%'] + [d[1] for d in data])
        writer.writerow(['%(right_numerator)%'] + [d[2] for d in data])
        writer.writerow(['%(right_denominator)%'] + [d[3] for d in data])
        writer.writerow(['%(operator)%'] + ['*' for _ in data])
        writer.writerow(['%(result_numerator)%'] + [d[4] for d in data])
        writer.writerow(['%(result_denominator)%'] + [d[5] for d in data])


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


def mass_produce(filename):
    with open(filename, newline='') as f:
        reader = csv.reader(f, delimiter='\t')
        for row in reader:
            print(', '.join(row))


if __name__ == '__main__':
    num = 3
    max_den = 8
    print(random_as(max_den, num))
    print(random_ad(max_den, num))
    print(random_m(max_den, num))
    gen_as('test.txt', max_den, num)
    mass_produce('test.txt')
    print('hello world')

