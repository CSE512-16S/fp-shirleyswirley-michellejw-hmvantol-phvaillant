rm(list=ls())

pwd<- "/Users/Helena/fp-shirleyswirley-michellejw-hmvantol-phvaillant/hmvantol/oil_sands"

localdata <- read.csv(paste0(pwd,"/localdata.csv"), header=F, col.names=c("date","localdata"))
globaldata <-  read.csv(paste0(pwd,"/globaldata.csv"), header=F, col.names=c("date","globaldata"))
imgs <- read.csv(paste0(pwd,"/outfile.csv"), header=F, col.names=c("file","x","y"))

localdata$date <- as.POSIXct(strptime(localdata$date, format="%m/%d/%y"))
globaldata$date <- as.POSIXct(strptime(globaldata$date, format="%m/%d/%Y"))

imgs[,1] <- as.character(imgs[,1])
imgs[,4] <- as.POSIXct(strptime(as.numeric(substr(imgs[,1],nchar(imgs[,1])-7,nchar(imgs[,1]))),format="%Y%m%d"))
colnames(imgs) <- c("file","x","y","date")

final<- merge(globaldata,localdata,by="date",all=T)
final <- merge(final, imgs, by="date", all=T)

final$date<- format(final$date, format = "%m/%d/%Y")

final<- final[,c(3,2,1,5,6)]

#colnames(final) <- c("localdata","globaldata","date","x","y","localylabel","globalylabel","annotation","title","intro","imgsrc","datasrc","fastfacts","moreinfo","moreinfosrc")


write.csv(final,paste0(pwd,"/location_number.csv"), row.names=F, na="null")
