rm(list=ls())

pwd<- "/Users/hmvantol/fp-shirleyswirley-michellejw-hmvantol-phvaillant/hmvantol/oil_sands"

localdata <- read.csv(paste0(pwd,"/localdata.csv"), header=F, col.names=c("date","localdata"), na.strings="NA")
globaldata <-  read.csv(paste0(pwd,"/globaldata.csv"), header=F, col.names=c("date","globaldata"), na.strings="NA")
imgs <- read.csv(paste0(pwd,"/outfile.csv"), header=F, col.names=c("file","x","y"))

localdata$date <- as.POSIXct(strptime(localdata$date, format="%m/%d/%Y"))
globaldata$date <- as.POSIXct(strptime(globaldata$date, format="%m/%d/%Y"))

imgs[,1] <- as.character(imgs[,1])
imgs[,4] <- as.POSIXct(strptime(as.numeric(substr(imgs[,1],nchar(imgs[,1])-7,nchar(imgs[,1]))),format="%Y%m%d"))
colnames(imgs) <- c("file","x","y","date")

final<- merge(globaldata,localdata,by="date",all=T)
final <- merge(final, imgs, by="date", all=T)
final$date<- format(final$date, format = "%m/%d/%Y")
final<- final[,c(3,2,1,5,6)]

# for (i in 1:nrow(final)) {
	# if (is.na(final$x[i]) == F) {
		# j = i - 1
		# while (is.na(final$localdata[j]) == T) {
			# j = j - 1
		# }
		# y1 = final$localdata[j]
		# x1 = final$date[j]
		# k = i + 1
		# while (is.na(final$localdata[k]) == T) {
			# k = k + 1
			# if (k > nrow(final)) {
				# break
			# }
		# }
		# if (k > nrow(final)) {
			# final$localdata[i] <- "Extrapolate"
		# }
		# else {
			# y2 = final$localdata[k]
			# x2 = final$date[k]
			# reg<- lm(c(y2,y1) ~ as.numeric(c(x2,x1)))
			# slope = reg$coefficients[1]
			# intercept = reg$coefficients[2]
			# print(slope*as.numeric(final$date[i]) + intercept)
		# }
	# }
# }



write.csv(final,paste0(pwd,"/merge_output.csv"), row.names=F, na="null")
