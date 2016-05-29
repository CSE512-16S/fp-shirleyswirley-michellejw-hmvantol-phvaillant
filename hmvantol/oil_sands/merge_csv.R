rm(list=ls())

pwd<- "/Users/Helena/fp-shirleyswirley-michellejw-hmvantol-phvaillant/hmvantol/oil_sands"

insitu <- read.csv(paste0(pwd,"/insitu.csv"), header=F, col.names=c("date","insitu","",""))[,1:2]
mining <- read.csv(paste0(pwd,"/mining.csv"), header=F, col.names=c("date","mining","",""))[,1:2]
imgs <- read.csv(paste0(pwd,"/outfile.csv"), header=F, col.names=c("file","x","y"))

combo<- merge(insitu, mining, by="date")
combo[,1]<- as.character(combo[,1])
combo[,1]<- as.character(as.POSIXct(strptime(combo[,1], format="%m/%d/%y")))

imgs[,1] <- as.character(imgs[,1])
imgs[,4] <- as.character(as.POSIXct(strptime(as.numeric(substr(imgs[,1],nchar(imgs[,1])-7,nchar(imgs[,1]))),format="%Y%m%d")))
colnames(imgs) <- c("file","x","y","date")

final<- merge(combo,imgs,by="date",all=T)

write.csv(final,paste0(pwd,"/athabasca1.csv"), row.names=F)
