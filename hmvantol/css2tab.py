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
		if "width" in line and trig1 == 0:
			w = line.strip("px;\r\n").strip("            width: ")
			trig1 = 1
		if "height" in line and trig2 == 0:
			h = line.strip("px;\r\n").strip("            height: ")
			trig2 = 1
		if " background-size" in line:
			xy_sum = line.strip(";\r\n").strip("                background-size: ")
			x_sum = xy.split(" ")[0].strip("px")
			y_sum = xy.split(" ")[1].strip("px")


with open("outfile.csv", "a") as outfile:
	outfile.write("w," + w + "\nh," + h + "\ntotal_w," + x_sum + "\ntotal_h," + y_sum + "\n")
	for i in range(len(img_name)):
		outfile.write(img_name[i] + "," + x[i] + "," + y[i] + "\n")