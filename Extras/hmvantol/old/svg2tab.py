import sys, re, numpy as np


path = []
with open(sys.argv[1] + ".svg", "r") as f:
	trig = 0
	for line in f:
		if "<path" in line:
			trig = 1
		if trig == 1:
			path.append(line)
			if "/>" in line:
				trig = 0

path_str = ""
for i in path:
	path_str = path_str + i.strip("\t").strip("\r\n").replace('"/>',''""'')

path_str = re.sub(r'<path(.*?d=")', "", path_str)
path_str = path_str.replace("l","\tl").replace("M","\nM").replace("-","\t-").replace(",","\t")
path_str = re.sub(r'h(\d*\.?\d*)', r'\tl\1\t0', path_str)
path_str = re.sub(r'V(\d*\.?\d*)', r'\tl0\t\1', path_str)
path_str = path_str.replace("l","").replace("\n","").replace(" ","")

paths = path_str.split("M")
x_col = []
y_col = []
n_col = []
count = 0

for n in paths[1:]:
	x = map(float, n.split("\t")[0::2])
	y = map(float, n.split("\t")[1::2])
	y = [y[0]] + [-1*i for i in y[1:]]
	x_col.append(np.cumsum(x).tolist())
	y_col.append(np.cumsum(y).tolist())
	n_col.append([count]*len(np.cumsum(x)))
	count += 1

x_col = [item for sublist in x_col for item in sublist]
y_col = [item for sublist in y_col for item in sublist]
n_col = [item for sublist in n_col for item in sublist]

outfile = open(sys.argv[1] + ".txt", "a")
for i in range(len(x_col)):
	outfile.write(str(n_col[i]) + "\t" + str(x_col[i]) + "\t" + str(y_col[i]) +"\n")

