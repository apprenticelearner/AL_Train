import pandas
import sys,os
import numpy as np

assert len(sys.argv) == 3, "takes three arguments <AL DATA IN> <AL DATA OUT>"
path = sys.argv[1]
df = pandas.read_csv(path, sep='\t', lineterminator='\n', skip_blank_lines=True).replace({r'\r': ''}, regex=True)
df = df.rename(index=str, columns={a:a.rstrip() for a in df.keys()})

for x in [x for x in df.columns if "Unnamed" in x]:
	del df[x]
# df.columns = [x if not "Unnamed" in x else "" for x in df.columns]

time_df = pandas.DataFrame({"Time": 1000*(1+np.arange(len(df.index)))})
# print(time_df['Time'])

print(df.columns)
df['Time'] = time_df['Time'].values

# print(df['Time'])
print(df.columns)

df.to_csv(path_or_buf=sys.argv[2], sep='\t', index=False)





