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
pretest_data[pretest_data$student == "Stu_7c4d22d19e3ef5a5a3ded1e604808912",]
pretest_data <- pretest_data[pretest_data$student != "Stu_7c4d22d19e3ef5a5a3ded1e604808912" | 
                           pretest_data$problem != "M 4_5_times_3_10" |
                           pretest_data$opp != 2,]
pretest_data[pretest_data$student == "Stu_7c4d22d19e3ef5a5a3ded1e604808912" & pretest_data$kc == "M done" & pretest_data$opp > 2,]$opp = pretest_data[pretest_data$student == "Stu_7c4d22d19e3ef5a5a3ded1e604808912" & pretest_data$kc == "M done" & pretest_data$opp > 2,]$opp - 1

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

hist(ddply(human_data, .(student, kc), summarise, total=length(student))$total)
hist(ddply(control_data, .(student, kc), summarise, total=length(student))$total)
hist(ddply(pretest_data, .(student, kc), summarise, total=length(student))$total)
hist(ddply(iso_data, .(student, kc), summarise, total=length(student))$total)
hist(ddply(substep_data, .(student, kc), summarise, total=length(student))$total)

fa_data <- rbind(human_data, control_data, pretest_data, iso_data, substep_data)
fa_data$domain <- "Fraction Arithmetic"

a <- fa_data[fa_data$opp >= 25,]

a <- human_data[human_data$student == "Stu_43ee2b184d8c92e61ec06c725f2a61ce",]
b <- control_data[control_data$student == "Stu_43ee2b184d8c92e61ec06c725f2a61ce",]

# The number of NA rows = 0
nrow(fa_data[is.na(fa_data),])

# Regression Models
# human.afm = glmer(correctness ~ kc + kc:opp + (1|student), data=human_data, family=binomial())
# pretest.afm = glmer(correctness ~ kc + kc:opp + (1|student), data=pretest_data, family=binomial())

# summary(human.afm)
# summary(pretest.afm)

# Learning Curves
ggplot(data=fa_data, aes(x=opp, y=1-correctness, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=subset(fa_data, agent_type != "Human")) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=subset(as_data, agent_type != "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=subset(fa_data, agent_type != "Human")) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=subset(fa_data, agent_type == "Human")) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=subset(as_data, agent_type == "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=subset(fa_data, agent_type == "Human")) + 
  #xlim(1,24) +
  theme(legend.position=c(.8,.8), legend.box="horizontal") +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Error") +
  ggtitle("Fraction Arithmetic") +
  scale_color_manual(values=brewer.pal(5, "Set1"))

for (kc in unique(fa_data$kc)){
  print(kc)
  sub_data = fa_data[fa_data$kc == kc,]
  # sub_data = subset(fa_data, fa_data$kc == kc)
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
  ggsave(filename=paste('plots/', kc, '.pdf'))
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
ggplot(data=dup_data_lon, aes(x=opp.Human, y=1-correctness, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=subset(dup_data_lon, agent_type != "Human")) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=subset(as_data, agent_type != "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=subset(dup_data_lon, agent_type != "Human")) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=subset(dup_data_lon, agent_type == "Human")) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=subset(as_data, agent_type == "Human")) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=subset(dup_data_lon, agent_type == "Human")) + 
  #xlim(1,24) +
  theme(legend.position=c(.8,.8), legend.box="horizontal") +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Error") +
  ggtitle("Fraction Arithmetic") +
  scale_color_manual(values=brewer.pal(5, "Set1"))

for (kc in unique(dup_data_lon$kc.Human)){
  print(kc)
  sub_data = dup_data_lon[dup_data_lon$kc.Human == kc,]
  # sub_data = subset(dup_data_lon, dup_data_lon$kc == kc)
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
                             overall_data_wide$opp.Human, overall_data_wide$residuals.Control, 
                             overall_data_wide$residuals.Pretest, overall_data_wide$residuals.Iso, 
                             overall_data_wide$residuals.Substep, overall_data_wide$residuals.Majority)
names(residuals_wide) <- c('domain', "student", "kc", "opp", "Control Residuals", "Pretest Residuals", "Iso Residuals", "Substep Residuals", "Majority Residuals")

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

# RMSE's
r = residuals_long[residuals_long$agent_type == "Control",]$residuals
sqrt(mean(r * r))
# [1] 0.5217057

r = residuals_long[residuals_long$agent_type == "Iso",]$residuals
sqrt(mean(r * r))
# [1] 0.4906279

r = residuals_long[residuals_long$agent_type == "Pretest",]$residuals
sqrt(mean(r * r))
# [1] 0.5079507

r = residuals_long[residuals_long$agent_type == "Substep",]$residuals
sqrt(mean(r * r))
# [1] 0.5283978

# CHI Squared?

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
# [1] 11618.91

AIC(control.pred)
# [1] 11508.97

AIC(pretest.pred)
# [1] 11593.43

AIC(iso.pred)
# [1] 11598.81

AIC(substep.pred)
# [1] 11521.79

# anova(base.pred, control.pred, pretest.pred, iso.pred)

AIC(base.pred.mixed)
# [1] 9558.656

AIC(control.pred.mixed)
# [1] 9555.679

AIC(pretest.pred.mixed)
# [1] 9560.568

AIC(iso.pred.mixed)
# [1] 9558.093

AIC(substep.pred.mixed)
# [1] 9556.878

# anova(base.pred.mixed, control.pred.mixed, pretest.pred.mixed, iso.pred.mixed)
# anova(pretest.pred.mixed, iso.pred.mixed)
