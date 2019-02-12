"""
hint_button -> hint
done -> done
JCommTable4_C1R1 -> num 3
4_C1R2 -> den 3
5_C1R1 -> num 4
5_C1R2 -> den 4
6_C1R1 -> num 5
6_C1R2 -> den 5
8_C1R1 -> check_convert
"""

import numpy as np
import pandas as pd

filename = 'ds_1190_Study2.txt'
df = pd.read_csv(filename, sep='\t')
dic = {'hint_button':'hint', 'done':'done', 'JCommTable4_C1R1':'num3','JCommTable4_C1R2':'den3', 'JCommTable5_C1R1':'num4', 'JCommTable5_C1R2':'den4', 'JCommTable6_C1R1':'num5', 'JCommTable6_C1R2':'den5', 'JCommTable8_C1R1':'check_convert', 'checkBoxGroup': 'check_convert'}

dic2 = {'num3': 'num5', 'den3': 'den5'}
print(list(df.columns.values))
temp = []
for row in range(len(df)):
    if df.iloc[row]['Selection'] in dic:
        temp.append(dic[df.iloc[row]['Selection']])
    else:
        if df.iloc[row]['Problem Name'].split()[0] in ['AS', 'MD','MS'] and df.iloc[row]['Selection'] in dic2:
            temp.append(dic2[df.iloc[row]['Selection']])
        else:	
            temp.append(df.iloc[row]['Selection'])


#temp2 = []
#for i in range(len(temp)):
#    if temp[i] == 'hint':
#        temp2.append(temp[i+1])
#    else:
#        temp2.append(temp[i])

temp3 = []
for i in range(len(temp)):
    temp3.append(df.iloc[i]['Problem Name'].split()[0]+" "+str(temp[i]))

df = df.drop('Selection', 1)
df = df.rename(columns = {'Step Name':'KC (Rule Name)'})
df['Selection'] = pd.Series(temp, index=df.index)
df['Step Name'] = pd.Series(temp, index=df.index)
df['KC (Literal Field)'] = pd.Series(temp, index=df.index)
df['KC (Field)'] = pd.Series(temp3, index=df.index)

df2 = pd.DataFrame(columns=df.columns.values)
student = ""
problem = ""
counter = 0
check_convert = True
problemtype = ""
for row in range(len(df)):
    if  df.iloc[row]['Problem Name'] != problem or df.iloc[row]['Anon Student Id'] != student :

        # if no check convert and as or m problem then add row for check convert
        if check_convert is False and problem_type in ['MD','MS' ,'AS']:
            df2 = df2.append(df.iloc[[row-1]], ignore_index=True)
            df2.set_value(counter, 'Step Name', 'check_convert')
            df2.set_value(counter, 'Outcome', 'CORRECT')
            counter += 1

            check_convert = False
            problem_type = df.iloc[row]['Problem Name'].split()[0]

        if df.iloc[row]['Step Name'] == 'check_convert':
            check_convert = True

        problem = df.iloc[row]['Problem Name']
        student = df.iloc[row]['Anon Student Id']

# if no check convert and as or m problem then add row for check convert
if check_convert is False and problem_type in ['MD', 'MS','AS']:
    df2 = df2.append(df.iloc[[len(df)-1]], ignore_index=True)
    df2.set_value(counter, 'Step Name', 'check_convert')
    df2.set_value(counter, 'Outcome', 'CORRECT')


df = df.append(df2, ignore_index=True)
df.to_csv('Modified_check_convert_inter.txt', sep='\t', header=True, index=False, float_format='%.0f')

