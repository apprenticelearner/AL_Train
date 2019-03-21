import pandas
import sys,os

assert len(sys.argv) == 4, "takes three arguments <Human DATA IN> <AL DATA IN> <AL DATA OUT>"
path = sys.argv[1]
df_human = pandas.read_csv(path, sep='\t', lineterminator='\n', skip_blank_lines=True).replace({r'\r': ''}, regex=True)
df_human = df_human.rename(index=str, columns={a:a.rstrip() for a in df_human.keys()})

path = sys.argv[2]
df = pandas.read_csv(path, sep='\t', lineterminator='\n', skip_blank_lines=True).replace({r'\r': ''}, regex=True)
df = df.rename(index=str, columns={a:a.rstrip() for a in df.keys()})

names_H = list(df_human['Anon Student Id'].unique())
names_AL = list(df['Anon Student Id'].unique())

print(df_human['Anon Student Id'].value_counts())
print(len(names_AL), len(names_H))
print(df_human['Anon Student Id'].value_counts().idxmin())
if(len(names_AL) < len(names_H) ):
	#fix the control case
	names_H.remove(df_human['Anon Student Id'].value_counts().idxmin())
	print(len(names_AL), len(names_H))
elif(len(names_AL) > len(names_H)):
	print(set(names_AL)-set(names_H))
	print(df['Anon Student Id'].value_counts())

assert len(names_AL) == len(names_H), "different number of names in datasets"


mapping = {al_id: h_id for h_id,al_id in zip(list(names_H), list(names_AL))}

df['Anon Student Id'] = df['Anon Student Id'].map(mapping)

df.to_csv(path_or_buf=sys.argv[3], sep='\t',index=False)





