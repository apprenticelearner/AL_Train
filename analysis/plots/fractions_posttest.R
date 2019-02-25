library(ggplot2)
library(reshape2)
library(RColorBrewer)

decisiontree_pre_post = read.csv("/Users/cmaclell/Projects/simstudent/AuthoringTools/java/Projects/fractionArithTutor/dt_ds1706_thesis_posttest.txt", header=TRUE, sep="\t", na.strings=c("", " "))
#decisiontree_pre_post = read.csv("/Users/cmaclell/Projects/simstudent/AuthoringTools/java/Projects/fractionArithTutor/rony_decisiontree_pre_post.txt", header=TRUE, sep="\t", na.strings=c("", " "))
cobweb_pre_post = read.csv("/Users/cmaclell/Projects/simstudent/AuthoringTools/java/Projects/fractionArithTutor/trestle_ds1706_thesis_posttest.txt", header=TRUE, sep="\t", na.strings=c("", " "))
#cobweb_pre_post = read.csv("/Users/cmaclell/Projects/simstudent/AuthoringTools/java/Projects/fractionArithTutor/rony_cobweb_pre_post.txt", header=TRUE, sep="\t", na.strings=c("", " "))
#simulated_pre_post = read.csv("/Users/cmaclell/Projects/simstudent/AuthoringTools/java/Projects/fractionArithTutor/AL-SimStudent-test-removed.txt", header=TRUE, sep="\t", na.strings=c("", " "))
human_pre_post = read.csv("/Users/cmaclell/Projects/simstudent/AuthoringTools/java/Projects/fractionArithTutor/rony_human_pre_post.csv", header=TRUE, sep=",", na.strings=c("", " "))
human_pre_post$Condition <- "Blocked"
human_pre_post[human_pre_post$Interleaved==1,]$Condition <- "Interleaved"
human_pre_post$Condition <- factor(human_pre_post$Condition)

human_pre_post$posttest <- (human_pre_post$M_Post_C + human_pre_post$A_Post_C) / 2
human_pre_post$pretest <- (human_pre_post$M_Pre_C + human_pre_post$A_Pre_C) / 2
#human_pre_post[is.na(human_pre_post$posttest),]$posttest <- 0

#cobweb_pre_post$M_Post_C <- (cobweb_pre_post$M.5_6_times_1_7 + cobweb_pre_post$M.7_8_times_1_3) / 2
#cobweb_pre_post$posttest <- (cobweb_pre_post$M_Post_C + cobweb_pre_post$A_Post_C) / 2
#decisiontree_pre_post$M_Post_C <- (decisiontree_pre_post$M.5_6_times_1_7 + decisiontree_pre_post$M.7_8_times_1_3) / 2
#decisiontree_pre_post$posttest <- (decisiontree_pre_post$M_Post_C + decisiontree_pre_post$A_Post_C) / 2

vars = c('Row.Labels', 'A_Post_C', 'M_Post_C', 'posttest', 'Condition')
human <- human_pre_post[vars]
human$Agent.Type <- "Human"

decisiontree <- decisiontree_pre_post[vars]
decisiontree$Agent.Type <- "Decision Tree"

cobweb <- cobweb_pre_post[vars]
cobweb$Agent.Type <- "Trestle"

data = rbind(human, decisiontree, cobweb)
data <- data[!is.na(data$posttest),]

data$Agent.Type <- ordered(data$Agent.Type, levels=c("Decision Tree", "Trestle", "Human"))

#levels(data$Agent.Type) <- c("Model1", "Human", "Model")
#data <- data[data$Agent.Type != "Model",]

Agent.Type = "Agent Type"
theme_set(theme_bw(base_size=22, base_family="Helvetica"))
ggplot(subset(data, Agent.Type=="Human"), aes(x=Condition, y=posttest, group=Agent.Type, color=Agent.Type, shape=Agent.Type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=subset(data, Agent.Type != "Human")) + 
  stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=subset(data, Agent.Type != "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=subset(data, Agent.Type != "Human")) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=subset(data, Agent.Type == "Human")) + 
  stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=subset(data, Agent.Type == "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=subset(data, Agent.Type == "Human")) + 
  theme(legend.position=c(.5,.3), legend.box="horizontal") +
  ylim(0,1) +
  ylab("Posttest Accuracy") +
  #ggtitle("Posttest Performance") +
  labs(color=Agent.Type, shape=Agent.Type) +
  scale_color_manual(values=brewer.pal(6, "Spectral")[c(5,1,6)])

# marginally significant effect of condition
human_m <- lm(posttest ~ Condition, data=data[data$Agent.Type=="Human",])
summary(human_m)

# significant effect of condition
dt_m <- lm(posttest ~ Condition, data=data[data$Agent.Type=="Decision Tree",])
summary(dt_m)

# significant effect of condition
cb_m <- lm(posttest ~ Condition , data=data[data$Agent.Type=="Trestle",])
summary(cb_m)

# No difference between DT and human performance in interleaved
t.test(subset(data, Agent.Type=="Decision Tree" & Condition=="Interleaved")$posttest, 
       subset(data, Agent.Type=="Human" & Condition=="Interleaved")$posttest)

# No difference between Trestle and human performance in interleaved
t.test(subset(data, Agent.Type=="Trestle" & Condition=="Interleaved")$posttest, 
       subset(data, Agent.Type=="Human" & Condition=="Interleaved")$posttest)

# All three agent types exhibt the same effect of condition.
m.human <- glm(posttest ~ Condition, data = subset(data, Agent.Type == "Human"))
m.tres <- glm(posttest ~ Condition, data = subset(data, Agent.Type == "Trestle"))
m.dt <- glm(posttest ~ Condition, data = subset(data, Agent.Type == "Decision Tree"))

# marginal effect of condition in human
summary(m.human)

# sig effect of condition in both agents
summary(m.tres)
summary(m.dt)