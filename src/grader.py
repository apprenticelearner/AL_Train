import sys,json

count = 0
ground_truth = {}
with open(sys.argv[1],'r') as f:
	for x in f:
		count += 1
		d = json.loads(x)
		# print(json.dumps(d["state"]))
		print([z.get('value',None) for k,z in d["state"].items()])
		ground_truth[json.dumps(d["state"])] = d["responses"]

print(len(ground_truth.keys()),count)

comparison = {}
with open(sys.argv[2],'r') as f:
	for x in f:
		d = json.loads(x)
		comparison[json.dumps(d["state"])] = d["responses"]
		print([z.get('value',None) for k,z in d["state"].items()])
		# print(len(d["state"].keys()),d["responses"])

complete = 0
first_correct = 0 
n = 0
for state,g_resps in ground_truth.items():

	assert state in comparison, "state set not same as ground truth"
	c_resps = comparison[state]
	# print(c_resps, g_resps)
	if(len(c_resps) > 0 and c_resps[0] in g_resps 
		or len(g_resps) == 0 and len(c_resps) == 0):
		first_correct += 1	

	print([z.get('value',None) for k,z in json.loads(state).items()])
	print([(z['selection'],z["inputs"]["value"]) for z in c_resps])
	print([(z['selection'],z["inputs"]["value"]) for z in g_resps])
	print()

	if(len(c_resps) == len(g_resps)):

		if(all([g_resp in c_resps for g_resp in g_resps])):
			complete += 1

	n += 1

print("n", n)
print("completeness:", float(complete)/float(n))
print("first_correct:", float(first_correct)/float(n))


