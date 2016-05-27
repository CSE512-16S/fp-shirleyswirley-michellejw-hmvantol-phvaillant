import sys

img_name = []
x = []
y = []

with open(sys.argv[1] + ".css", "r") as f:
	trig1 = 0
	trig2 = 0
	for line in f:
		if line.startswith("        .sprite") and line.strip("\r\n").endswith("{"):
			img_name.append(line.strip(" {\r\n").strip(" ").replace(".sprite-"+sys.argv[1]+"-",""))
		if "background-position" in line:
			xy = line.strip(";\r\n").strip("            background-position:")
			x.append(xy.split(" ")[0].strip("px"))
			y.append(xy.split(" ")[1].strip("px"))


with open("outfile.csv", "a") as outfile:
	for i in range(len(img_name)):
		outfile.write(img_name[i] + "," + x[i] + "," + y[i] + "\n")