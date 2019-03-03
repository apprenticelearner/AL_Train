# Load packages
library(plyr)
library(lme4)
library(ggplot2)
library(RColorBrewer)
library(caret)
library(Hmisc)
agent_type="Agent Type"

theme_set(theme_bw(base_size=16, base_family="Helvetica"))

Mode <- function(x) {
  ux <- unique(x)
  ux[which.max(tabulate(match(x, ux)))]
}

#######################
# FRACTION ARITHMETIC #
#######################

# Human
human_data = read.csv("human.txt", header=TRUE, sep="\t", na.strings=c("", " "))
human_data$correctness <- 0
human_data[human_data$First.Attempt == "correct",]$correctness <- 1
# human_data = data.frame(human_data$Anon.Student.Id, human_data$Problem.Name, human_data$correctness, human_data$Opportunity..Literal.Field., human_data$KC..Literal.Field.)
human_data = data.frame(human_data$Anon.Student.Id, human_data$Problem.Name, human_data$correctness, human_data$Opportunity..Field., human_data$KC..Field.)
names(human_data) <- c('student', 'problem', 'correctness', 'opp', 'kc')
human_data <- human_data[human_data$kc != "InstructionSlide done",]
human_data <- human_data[human_data$kc != "AS null.nextButton",]
human_data <- human_data[human_data$kc != "AD null.nextButton",]
human_data <- human_data[human_data$kc != "AD blankProblem",]
human_data <- human_data[human_data$kc != "AD blankAnswer",]
human_data <- human_data[human_data$kc != "AD operation2",]
human_data <- human_data[human_data$kc != "M null.nextButton",]
human_data <- human_data[human_data$kc != "AD null.previousButton",]
human_data <- human_data[human_data$kc != "AS null.previousButton",]
human_data <- human_data[human_data$kc != "M null.previousButton",]
human_data <- human_data[human_data$kc != "M blankProblem",]
human_data <- human_data[human_data$kc != "AS hint",]
human_data <- human_data[human_data$kc != "AD hint",]
human_data <- human_data[human_data$kc != "M hint",]
human_data <- human_data[!is.na(human_data$kc),]

human_data$kc <- factor(human_data$kc)
unique(human_data$kc)
human_data$agent_type = "Human"
unique(human_data$problem)

# Hunt for data where the humans have more opportunities than agents.
human_data[human_data$opp >= 25,]

# Remove data with really long data
s = human_data[human_data$kc == "AD done",]
s[s$opp > 15,]
human_data <- human_data[human_data$student != "Stu_a583148911cbf1308958efb355bb431c",]

# Remove student's duplicate problems... treat as if they only saw it once.
human_data <- human_data[human_data$student != "Stu_43ee2b184d8c92e61ec06c725f2a61ce" | 
                         human_data$problem != "MS 2_9_times_3_9" |
                         human_data$opp != 13,]
human_data[human_data$student == "Stu_43ee2b184d8c92e61ec06c725f2a61ce" & human_data$opp > 13 & human_data$problem != "AD 1_4_plus_4_5",]$opp = human_data[human_data$student == "Stu_43ee2b184d8c92e61ec06c725f2a61ce" & human_data$opp > 13 & human_data$problem != "AD 1_4_plus_4_5",]$opp - 1
human_data[human_data$student == "Stu_43ee2b184d8c92e61ec06c725f2a61ce",]

# Remove second student's duplicate problem... treat as if they only saw it once.
human_data <- human_data[human_data$student != "Stu_6a17ab9903ecc5292a40b43443df7fb6" | 
                           human_data$problem != "MS 7_9_times_4_9" |
                           human_data$opp != 5,]
human_data[human_data$student == "Stu_6a17ab9903ecc5292a40b43443df7fb6" & human_data$opp > 5 & human_data$problem != "AD 1_4_plus_4_5" & substr(human_data$kc,start=0, stop=1) == "M",]$opp = human_data[human_data$student == "Stu_6a17ab9903ecc5292a40b43443df7fb6" & human_data$opp > 5 & human_data$problem != "AD 1_4_plus_4_5" & substr(human_data$kc,start=0, stop=1) == "M",]$opp - 1

human_data[human_data$student == "Stu_6a17ab9903ecc5292a40b43443df7fb6",]


# Control
control_data = read.csv("control.txt", header=TRUE, sep="\t", na.strings=c("", " "))
control_data$correctness <- 0
control_data[control_data$First.Attempt == "correct",]$correctness <- 1
control_data = data.frame(control_data$Anon.Student.Id, control_data$Problem.Name, control_data$correctness, control_data$Opportunity..Field., control_data$KC..Field.)
names(control_data) <- c('student', 'problem', 'correctness', 'opp', 'kc')
control_data <- subset(control_data, (control_data$kc %in% unique(human_data$kc)))
control_data <- control_data[!is.na(control_data$kc),]
control_data$kc <- factor(control_data$kc)
unique(control_data$kc)
control_data$agent_type = "Control"

# Pretest
pretest_data = read.csv("pretest.txt", header=TRUE, sep="\t", na.strings=c("", " "))
pretest_data$correctness <- 0
pretest_data[pretest_data$First.Attempt == "correct",]$correctness <- 1
pretest_data = data.frame(pretest_data$Anon.Student.Id, pretest_data$Problem.Name, pretest_data$correctness, pretest_data$Opportunity..Field., pretest_data$KC..Field.)
names(pretest_data) <- c('student', 'problem', 'correctness', 'opp', 'kc')
pretest_data <- subset(pretest_data, (pretest_data$kc %in% unique(human_data$kc)))
pretest_data <- pretest_data[!is.na(pretest_data$kc),]
pretest_data$kc <- factor(pretest_data$kc)
unique(pretest_data$kc)
pretest_data$agent_type = "Pretest"

# Hunt for case where pretest is longer than others.
pretest_data[pretest_data$opp >= 25,]

# clean up long student - one step is double counted... seems like an e
# look like the double counting may have been an issue with the time.
# pretest_data[pretest_data$student == "Stu_7c4d22d19e3ef5a5a3ded1e604808912",]
# pretest_data <- pretest_data[pretest_data$student != "Stu_7c4d22d19e3ef5a5a3ded1e604808912" | 
#                            pretest_data$problem != "M 4_5_times_3_10" |
#                            pretest_data$opp != 2,]
# pretest_data[pretest_data$student == "Stu_7c4d22d19e3ef5a5a3ded1e604808912" & pretest_data$kc == "M done" & pretest_data$opp > 2,]$opp = pretest_data[pretest_data$student == "Stu_7c4d22d19e3ef5a5a3ded1e604808912" & pretest_data$kc == "M done" & pretest_data$opp > 2,]$opp - 1

iso_data = read.csv("iso.txt", header=TRUE, sep="\t", na.strings=c("", " "))
iso_data$correctness <- 0
iso_data[iso_data$First.Attempt == "correct",]$correctness <- 1
iso_data = data.frame(iso_data$Anon.Student.Id, iso_data$Problem.Name, iso_data$correctness, iso_data$Opportunity..Field., iso_data$KC..Field.)
names(iso_data) <- c('student', 'problem', 'correctness', 'opp', 'kc')
iso_data <- subset(iso_data, (iso_data$kc %in% unique(human_data$kc)))
iso_data <- iso_data[!is.na(iso_data$kc),]
iso_data$kc <- factor(iso_data$kc)
unique(iso_data$kc)
iso_data$agent_type = "Iso"

substep_data = read.csv("substep.txt", header=TRUE, sep="\t", na.strings=c("", " "))
substep_data$correctness <- 0
substep_data[substep_data$First.Attempt == "correct",]$correctness <- 1
substep_data = data.frame(substep_data$Anon.Student.Id, substep_data$Problem.Name, substep_data$correctness, substep_data$Opportunity..Field., substep_data$KC..Field.)
names(substep_data) <- c('student', 'problem', 'correctness', 'opp', 'kc')
substep_data <- subset(substep_data, (substep_data$kc %in% unique(human_data$kc)))
substep_data <- substep_data[!is.na(substep_data$kc),]
substep_data$kc <- factor(substep_data$kc)
unique(substep_data$kc)
substep_data$agent_type = "Substep"

# hist(ddply(human_data, .(student, kc), summarise, total=length(student))$total)
# hist(ddply(control_data, .(student, kc), summarise, total=length(student))$total)
# hist(ddply(pretest_data, .(student, kc), summarise, total=length(student))$total)
# hist(ddply(iso_data, .(student, kc), summarise, total=length(student))$total)
# hist(ddply(substep_data, .(student, kc), summarise, total=length(student))$total)

fa_data <- rbind(human_data, control_data, pretest_data, iso_data, substep_data)
fa_data$domain <- "Fraction Arithmetic"

condition_mapping = read.csv("conditions.txt", header=TRUE, sep="\t", na.strings=c("", " "))
condition_mapping$condition <- as.character(condition_mapping$condition)
condition_mapping[condition_mapping$condition == "I ",]$condition <- "I"
condition_mapping$student <- as.factor(condition_mapping$student)
# s1 <- unique(fa_data$student)
# s2 <- unique(condition_mapping$student)
# factor(s2[!(s2 %in% s1)])
fa_data <- merge(fa_data, condition_mapping, by="student")

# The number of NA rows = 0
nrow(fa_data[is.na(fa_data),])

# Regression Models
# human.afm = glmer(correctness ~ kc + kc:opp + (1|student), data=human_data, family=binomial())
# pretest.afm = glmer(correctness ~ kc + kc:opp + (1|student), data=pretest_data, family=binomial())

# summary(human.afm)
# summary(pretest.afm)

# Learning Curves
# graph_data <- subset(fa_data, condition=="AM")
graph_data <- fa_data
ggplot(data=graph_data, aes(x=opp, y=1-correctness, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=subset(graph_data, agent_type != "Human")) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=subset(as_data, agent_type != "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=subset(graph_data, agent_type != "Human")) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=subset(graph_data, agent_type == "Human")) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=subset(as_data, agent_type == "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=subset(graph_data, agent_type == "Human")) + 
  #xlim(1,24) +
  theme(legend.position=c(.8,.8), legend.box="horizontal") +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Error") +
  ggtitle("Fraction Arithmetic") +
  scale_color_manual(values=brewer.pal(5, "Set1"))

for (kc in unique(graph_data$kc)){
  print(kc)
  sub_data = graph_data[graph_data$kc == kc,]
  # sub_data = subset(graph_data, graph_data$kc == kc)
  ggplot(data=sub_data, aes(x=opp, y=1-correctness, color=agent_type, shape=agent_type)) +
    stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=subset(sub_data, agent_type != "Human")) + 
    #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=subset(as_data, agent_type != "Human")) + 
    stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=subset(sub_data, agent_type != "Human")) + 
    stat_summary(fun.y = mean, geom = "line", size=1.5, data=subset(sub_data, agent_type == "Human")) + 
    #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=subset(as_data, agent_type == "Human")) + 
    stat_summary(fun.y = mean, geom = "point", size=4, data=subset(sub_data, agent_type == "Human")) + 
    # xlim(1,24) +
    theme(legend.position=c(.8,.8), legend.box="horizontal") +
    labs(color=agent_type, shape=agent_type) + 
    xlab("# of Practice Opportunities") +
    ylab("Average Error") +
    ggtitle(paste("Fraction Arithmetic KC = ", kc)) +
    scale_color_manual(values=brewer.pal(5, "Set1"))
  ggsave(filename=paste('plots/', kc, '.png'))
}

overall_data <- rbind(fa_data)
overall_data$domain <- factor(overall_data$domain)
summary(overall_data$domain)

#############################
# OVERALL RESIDUAL ANALYSIS #
#############################
overall_data$stu_kc_opp <- paste(overall_data$student, overall_data$kc, overall_data$opp)
kc_opp_counts <-count(subset(overall_data, agent_type == "Human")$stu_kc_opp)

overall_data_wide <- reshape(overall_data, idvar = "stu_kc_opp", timevar = "agent_type", direction = "wide")
overall_data_wide <- overall_data_wide[complete.cases(overall_data_wide),]

dup_data_lon <- residuals_long <- reshape(overall_data_wide, 
                                          varying = c("correctness.Substep", "correctness.Pretest", "correctness.Iso", "correctness.Human", "correctness.Control"), 
                                          v.names = "correctness",
                                          timevar = "agent_type", 
                                          times = c("Substep", "Pretest", "Iso", "Human", "Control"),
                                          direction = "long")

# Learning Curves with matched data.
#graph_data <- subset(dup_data_lon, condition.Human == "AM")
graph_data <- dup_data_lon
ggplot(data=graph_data, aes(x=opp.Human, y=1-correctness, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=subset(graph_data, agent_type != "Human")) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=subset(as_data, agent_type != "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=subset(graph_data, agent_type != "Human")) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=subset(graph_data, agent_type == "Human")) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=subset(as_data, agent_type == "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=subset(graph_data, agent_type == "Human")) + 
  #xlim(1,24) +
  theme(legend.position=c(.8,.8), legend.box="horizontal") +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Error") +
  # ggtitle("Fraction Arithmetic") +
  scale_color_manual(values=brewer.pal(5, "Set1"))

for (kc in unique(graph_data$kc.Human)){
  print(kc)
  sub_data = graph_data[graph_data$kc.Human == kc,]
  # sub_data = subset(graph_data, graph_data$kc == kc)
  ggplot(data=sub_data, aes(x=opp.Human, y=1-correctness, color=agent_type, shape=agent_type)) +
    stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=subset(sub_data, agent_type != "Human")) + 
    #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=subset(as_data, agent_type != "Human")) + 
    stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=subset(sub_data, agent_type != "Human")) + 
    stat_summary(fun.y = mean, geom = "line", size=1.5, data=subset(sub_data, agent_type == "Human")) + 
    #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=subset(as_data, agent_type == "Human")) + 
    stat_summary(fun.y = mean, geom = "point", size=4, data=subset(sub_data, agent_type == "Human")) + 
    # xlim(1,24) +
    theme(legend.position=c(.8,.8), legend.box="horizontal") +
    labs(color=agent_type, shape=agent_type) + 
    xlab("# of Practice Opportunities") +
    ylab("Average Error") +
    ggtitle(paste("Fraction Arithmetic KC = ", kc)) +
    scale_color_manual(values=brewer.pal(5, "Set1"))
  ggsave(filename=paste('plots/', kc, '.png'))
}

overall_data_wide$residuals.Control <- overall_data_wide$correctness.Human - overall_data_wide$`correctness.Control`
overall_data_wide$residuals.Pretest <- overall_data_wide$correctness.Human - overall_data_wide$`correctness.Pretest`
overall_data_wide$residuals.Iso <- overall_data_wide$correctness.Human - overall_data_wide$`correctness.Iso`
overall_data_wide$residuals.Substep <- overall_data_wide$correctness.Human - overall_data_wide$`correctness.Substep`

overall_data_wide$residuals.Majority <- overall_data_wide$correctness.Human - 1

residuals_wide <- data.frame(overall_data_wide$domain.Human, overall_data_wide$student.Human, overall_data_wide$kc.Human, 
                             overall_data_wide$condition.Human,
                             overall_data_wide$opp.Human, overall_data_wide$residuals.Control, 
                             overall_data_wide$residuals.Pretest, overall_data_wide$residuals.Iso, 
                             overall_data_wide$residuals.Substep, overall_data_wide$residuals.Majority)
names(residuals_wide) <- c('domain', "student", "kc", "condition", "opp", "Control Residuals", "Pretest Residuals", "Iso Residuals", "Substep Residuals", "Majority Residuals")

residuals_long <- reshape(residuals_wide, 
                         varying = c("Control Residuals", "Pretest Residuals", "Iso Residuals", "Substep Residuals", "Majority Residuals"), 
                         v.names = "residuals",
                         timevar = "agent_type", 
                         times = c("Control", "Pretest", "Iso", "Substep", "Majority"),
                         direction = "long")

ggplot(data=subset(subset(residuals_long, residuals_long$agent_type != "Majority"), domain=="Fraction Arithmetic"), aes(x=opp, y=-1*residuals, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = "mean", size=4, geom="point") +
  stat_summary(fun.y = "mean", size=1.5, geom="line") +
  stat_summary(fun.data = mean_cl_boot, geom = "errorbar") + 
  # xlim(1,24) +
  theme(legend.position=c(.8,.3), legend.box="horizontal") +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Model Residuals (Human - Model)") +
  # ggtitle("Overall Model Residuals (all knowledge components, all domains)") +
  scale_color_manual(values=brewer.pal(5, "Set1")[c(1, 3, 4, 5)])

# Accuracy and RMSE's
r = residuals_long[residuals_long$agent_type == "Majority",]$residuals
sqrt(mean(r * r)) # RMSE =  0.3219292
mean(abs(r)) # MAE = 0.1036384
1-mean(abs(r)) # Accuracy 0.8963616

r = residuals_long[residuals_long$agent_type == "Control",]$residuals
sqrt(mean(r * r)) # RMSE = 0.561992
mean(abs(r)) # MAE = 0.315835
1-mean(abs(r)) # Accuracy 0.684165

r = residuals_long[residuals_long$agent_type == "Iso",]$residuals
sqrt(mean(r * r)) # [1] 0.4411645
mean(abs(r)) # 0.1946262
1-mean(abs(r)) # Accuracy 0.8053738

r = residuals_long[residuals_long$agent_type == "Pretest",]$residuals
sqrt(mean(r * r)) # [1] 0.5469274
mean(abs(r)) # 0.2991296
1-mean(abs(r)) # Accuracy 0.7008704

r = residuals_long[residuals_long$agent_type == "Substep",]$residuals
sqrt(mean(r * r)) # [1] 0.5646313
mean(abs(r)) # 0.3188085
1-mean(abs(r)) # Accuracy 0.6811915

# RMSE First Opportunity
r = residuals_long[residuals_long$agent_type == "Control" & residuals_long$opp==1,]$residuals
sqrt(mean(r * r)) # [1] 0.8271702
mean(abs(r)) # 0.6842105
1-mean(abs(r)) # Accuracy 0.3157895

r = residuals_long[residuals_long$agent_type == "Iso" & residuals_long$opp==1,]$residuals
sqrt(mean(r * r)) # [1] 0.5972071
mean(abs(r)) # 0.3566563
1-mean(abs(r)) # Accuracy 0.6433437

r = residuals_long[residuals_long$agent_type == "Pretest" & residuals_long$opp==1,]$residuals
sqrt(mean(r * r)) # [1] 0.7813618
mean(abs(r)) # 0.6105263
1-mean(abs(r)) # Accuracy 0.3894737

r = residuals_long[residuals_long$agent_type == "Substep" & residuals_long$opp==1,,]$residuals
sqrt(mean(r * r)) # [1] 0.8211598
mean(abs(r)) # 0.6743034
1-mean(abs(r)) # Accuracy 0.3256966

# CHI Squared?
table(overall_data_wide$correctness.Human, overall_data_wide$correctness.Control)
chisq.test(overall_data_wide$correctness.Human, overall_data_wide$correctness.Control)
chisq.test(overall_data_wide$correctness.Human, overall_data_wide$correctness.Iso)
chisq.test(overall_data_wide$correctness.Human, overall_data_wide$correctness.Pretest)
chisq.test(overall_data_wide$correctness.Human, overall_data_wide$correctness.Substep)

# Fractions
base.pred <- glm(correctness.Human ~ opp.Human, data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())
base.pred.mixed <- glmer(correctness.Human ~ opp.Human + (1 + opp.Human|kc.Human) + (1|student.Human), data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())

control.pred <- glm(correctness.Human ~ opp.Human + correctness.Control, data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())
control.pred.mixed <- glmer(correctness.Human ~ opp.Human + correctness.Control + (1 + opp.Human|kc.Human) + (1|student.Human), data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())

pretest.pred <- glm(correctness.Human ~ opp.Human + correctness.Pretest, data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())
pretest.pred.mixed <- glmer(correctness.Human ~ opp.Human + correctness.Pretest + (1 + opp.Human|kc.Human) + (1|student.Human), data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())

iso.pred <- glm(correctness.Human ~ opp.Human + correctness.Iso, data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())
iso.pred.mixed <- glmer(correctness.Human ~ opp.Human + correctness.Iso + (1 + opp.Human|kc.Human) + (1|student.Human), data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())

substep.pred <- glm(correctness.Human ~ opp.Human + correctness.Substep, data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())
substep.pred.mixed <- glmer(correctness.Human ~ opp.Human + correctness.Substep + (1 + opp.Human|kc.Human) + (1|student.Human), data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())


AIC(base.pred)
# [1] 11612.76

summary(control.pred)
AIC(control.pred)
# [1] 11426.53

summary(pretest.pred)
AIC(pretest.pred)
# [1] 11453.64

summary(iso.pred)
AIC(iso.pred)
# [1] 11455.47

summary(substep.pred)
AIC(substep.pred)
# [1] 11460.31

# anova(base.pred, control.pred, pretest.pred, iso.pred)

summary(base.pred.mixed)
AIC(base.pred.mixed) # 9558.7
BIC(base.pred.mixed) # 9605.652

summary(control.pred.mixed)
AIC(control.pred.mixed) # 9541.303
BIC(control.pred.mixed) # 9596.08

summary(pretest.pred.mixed)
AIC(pretest.pred.mixed) # 9548.186
BIC(pretest.pred.mixed) # 9602.964

summary(iso.pred.mixed)
AIC(iso.pred.mixed) # 9558.093
BIC(iso.pred.mixed) # 9603.631

summary(substep.pred.mixed)
AIC(substep.pred.mixed) # 9556.399
BIC(substep.pred.mixed) # 9611.177

# anova(base.pred.mixed, control.pred.mixed, pretest.pred.mixed, iso.pred.mixed)
# anova(pretest.pred.mixed, iso.pred.mixed)

# line fit to residuals
control.resid.lm <- lm(residuals ~ opp, data=subset(residuals_long, agent_type=="Control"))
summary(control.resid.lm)
# Estimate Std. Error t value Pr(>|t|)    
# (Intercept)  0.4741191  0.0061595   76.97   <2e-16 ***
# opp         -0.0296711  0.0006235  -47.59   <2e-16 ***
confint((control.resid.lm))

pretest.resid.lm <- lm(residuals ~ opp, data=subset(residuals_long, agent_type=="Pretest"))
summary(pretest.resid.lm)
# Estimate Std. Error t value Pr(>|t|)    
# (Intercept)  0.4218379  0.0061689   68.38   <2e-16 ***
# opp         -0.0264184  0.0006245  -42.31   <2e-16 ***
confint((pretest.resid.lm))

iso.resid.lm <- lm(residuals ~ opp, data=subset(residuals_long, agent_type=="Iso"))
summary(iso.resid.lm)
# Estimate Std. Error t value Pr(>|t|)    
# (Intercept)  0.1079673  0.0055724   19.38   <2e-16 ***
# opp         -0.0065921  0.0005641  -11.69   <2e-16 ***
confint((iso.resid.lm))

substep.resid.lm <- lm(residuals ~ opp, data=subset(residuals_long, agent_type=="Substep"))
summary(substep.resid.lm)
# Estimate Std. Error t value Pr(>|t|)    
# (Intercept)  0.4899315  0.0061430   79.75   <2e-16 ***
# opp         -0.0314343  0.0006218  -50.55   <2e-16 ***
confint((substep.resid.lm))

# Error rates by type
