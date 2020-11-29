import os
import shutil
import random

path = 'gen'
if os.path.exists(path):
    shutil.rmtree(path)
os.makedirs(path)





for _ in range(1000):
    s1 = "".join([str(random.randint(0, 9)) for _ in range(3)])
    s2 = "".join([str(random.randint(0, 9)) for _ in range(3)])
    data = \
f'''import("../add.nools");
global first_number="{s1}";
global second_number="{s2}";
'''
    name = f'{s1}_{s2}'
    with open(f'gen/{name}.nools', 'w') as f:
        f.write(data)

