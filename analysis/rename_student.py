stu_key = {}
output = []

name = 'pretest'

with open(name + '.txt') as fin:
    key = None
    for row in fin:
        if key is None:
            output.append(row.split('\t'))
            key = {v: i for i, v in enumerate(row.split("\t"))}
            continue
        row = row.split('\t')
        output.append(row)

        if 'Stu_' in row[key['Problem Name']]:
            stu_key[row[key['Anon Student Id']]] = "_".join(row[key['Problem Name']].split('_')[:-2])

        # print(row[key['Problem Name']])

print(key)
print(stu_key)

with open(name + '_renamed.txt', 'w') as fout:
    for i, row in enumerate(output):
        if i != 0:
            row[key['Anon Student Id']] = stu_key[row[key['Anon Student Id']]]
        fout.write("\t".join(row))

