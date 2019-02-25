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
human_data$kc <- factor(human_data$kc)
unique(human_data$kc)
human_data$agent_type = "Human"

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

fa_data <- rbind(human_data, control_data, pretest_data, iso_data)
fa_data$domain <- "Fraction Arithmetic"

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
  xlim(1,24) +
  theme(legend.position=c(.8,.8), legend.box="horizontal") +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Error") +
  ggtitle("Fraction Arithmetic") +
  scale_color_manual(values=brewer.pal(4, "Spectral"))

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
    scale_color_manual(values=brewer.pal(4, "Spectral"))
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

overall_data_wide$residuals.Control <- overall_data_wide$correctness.Human - overall_data_wide$`correctness.Control`
overall_data_wide$residuals.Pretest <- overall_data_wide$correctness.Human - overall_data_wide$`correctness.Pretest`
overall_data_wide$residuals.Iso <- overall_data_wide$correctness.Human - overall_data_wide$`correctness.Iso`

overall_data_wide$residuals.Majority <- overall_data_wide$correctness.Human - 1

residuals_wide <- data.frame(overall_data_wide$domain.Human, overall_data_wide$student.Human, overall_data_wide$kc.Human, 
                             overall_data_wide$opp.Human, overall_data_wide$residuals.Control, 
                             overall_data_wide$residuals.Pretest, overall_data_wide$residuals.Iso,
                             overall_data_wide$residuals.Majority)
names(residuals_wide) <- c('domain', "student", "kc", "opp", "Control Residuals", "Pretest Residuals", "Iso Residuals", "Majority Residuals")

residuals_long <- reshape(residuals_wide, 
                         varying = c("Control Residuals", "Pretest Residuals", "Iso Residuals", "Majority Residuals"), 
                         v.names = "residuals",
                         timevar = "agent_type", 
                         times = c("Control", "Pretest", "Iso", "Majority"),
                         direction = "long")

ggplot(data=subset(residuals_long, domain=="Fraction Arithmetic"), aes(x=opp, y=-1*residuals, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = "mean", size=4, geom="point") +
  stat_summary(fun.y = "mean", size=1.5, geom="line") +
  stat_summary(fun.data = mean_cl_boot, geom = "errorbar") + 
  xlim(1,24) +
  theme(legend.position=c(.8,.3), legend.box="horizontal") +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Model Residuals (Human - Model)") +
  # ggtitle("Overall Model Residuals (all knowledge components, all domains)") +
  scale_color_manual(values=brewer.pal(6, "Spectral")[c(5,6,1,2)])

# Fractions
base.pred <- glm(correctness.Human ~ opp.Human, data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())
base.pred.mixed <- glmer(correctness.Human ~ opp.Human + (1 + opp.Human|kc.Human) + (1|student.Human), data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())

control.pred <- glm(correctness.Human ~ opp.Human + correctness.Control, data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())
control.pred.mixed <- glmer(correctness.Human ~ opp.Human + correctness.Control + (1 + opp.Human|kc.Human) + (1|student.Human), data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())

pretest.pred <- glm(correctness.Human ~ opp.Human + correctness.Pretest, data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())
pretest.pred.mixed <- glmer(correctness.Human ~ opp.Human + correctness.Pretest + (1 + opp.Human|kc.Human) + (1|student.Human), data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())

iso.pred <- glm(correctness.Human ~ opp.Human + correctness.Iso, data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())
iso.pred.mixed <- glmer(correctness.Human ~ opp.Human + correctness.Iso + (1 + opp.Human|kc.Human) + (1|student.Human), data=subset(overall_data_wide, domain.Human=="Fraction Arithmetic"), family=binomial())

summary(base.pred.mixed)
summary(pretest.pred.mixed)
summary(iso.pred.mixed)

AIC(base.pred)
AIC(control.pred)
AIC(pretest.pred)
AIC(iso.pred)
anova(base.pred, control.pred, pretest.pred, iso.pred)

AIC(base.pred.mixed)
AIC(control.pred.mixed)
AIC(pretest.pred.mixed)
AIC(iso.pred.mixed)

anova(base.pred.mixed, control.pred.mixed, pretest.pred.mixed, iso.pred.mixed)
anova(pretest.pred.mixed, iso.pred.mixed)