library(ggplot2)
theme_set(theme_bw(base_size=22, base_family="Helvetica"))

# Import the data
human_data = read.csv("/Users/cmaclell/Documents/Research/CMU/thesis/Analysis/fraction_arithmetic/human.txt", header=TRUE, sep="\t", na.strings=c("", " "))
trestle_data = read.csv("/Users/cmaclell/Documents/Research/CMU/thesis/Analysis/fraction_arithmetic/trestle.txt", header=TRUE, sep="\t", na.strings=c("", " "))
dt_data = read.csv("/Users/cmaclell/Documents/Research/CMU/thesis/Analysis/fraction_arithmetic/decision_tree.txt", header=TRUE, sep="\t", na.strings=c("", " "))

# Clean the data up
human_data$correctness <- 0
human_data[human_data$First.Attempt == "correct",]$correctness <- 1
human_data = data.frame(human_data$Anon.Student.Id, human_data$Problem.Name, human_data$correctness, human_data$Opportunity..Field., human_data$KC..Field., human_data$Condition)
names(human_data) <- c('student', 'problem', 'correctness', 'opp', 'kc', 'condition')
human_data$agent_type = "Human"

trestle_data$correctness <- 0
trestle_data[trestle_data$First.Attempt == "correct",]$correctness <- 1
trestle_data$Condition <- as.character(trestle_data$Condition)
trestle_data[trestle_data$Condition == "Blocked (Condition)",]$Condition <- "Blocked"
trestle_data[trestle_data$Condition == "Interleaved (Condition)",]$Condition <- "Interleaved"
trestle_data$Condition <- factor(trestle_data$Condition)
trestle_data = data.frame(trestle_data$Anon.Student.Id, trestle_data$Problem.Name, trestle_data$correctness, trestle_data$Opportunity..Field., trestle_data$KC..Field., trestle_data$Condition)
names(trestle_data) <- c('student', 'problem', 'correctness', 'opp', 'kc', 'condition')
trestle_data <- trestle_data[trestle_data$kc != "done",]
trestle_data$agent_type = "Trestle"

dt_data$correctness <- 0
dt_data[dt_data$First.Attempt == "correct",]$correctness <- 1
dt_data$Condition <- as.character(dt_data$Condition)
dt_data[dt_data$Condition == "Blocked (Condition)",]$Condition <- "Blocked"
dt_data[dt_data$Condition == "Interleaved (Condition)",]$Condition <- "Interleaved"
dt_data$Condition <- factor(dt_data$Condition)
dt_data = data.frame(dt_data$Anon.Student.Id, dt_data$Problem.Name, dt_data$correctness, dt_data$Opportunity..Field., dt_data$KC..Field., dt_data$Condition)
names(dt_data) <- c('student', 'problem', 'correctness', 'opp', 'kc', 'condition')
dt_data <- dt_data[dt_data$kc != "done",]
dt_data$agent_type = "Decision Tree"

fa_data <- rbind(human_data, trestle_data, dt_data)
fa_data$domain <- "Fraction Arithmetic"

# The number of NA rows = 0
nrow(fa_data[is.na(fa_data),])

human = subset(fa_data, agent_type == "Human")
not_human = subset(fa_data, agent_type != "Human")

# Learning Curves
ggplot(data=fa_data, aes(x=opp, y=1-correctness, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=not_human) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=not_human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=not_human) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=human) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=human) + 
  theme(legend.position=c(.8,.8), legend.box="horizontal") +
  xlim(1,22) +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Error") +
  ggtitle("Learning Curve for Fraction Arithmetic") +
  scale_color_manual(values=brewer.pal(6, "Spectral")[c(5,1,6,1)])

# Overall Tutor Performance
agent_type="Agent Type"
ggplot(data=fa_data, aes(x=condition, y=correctness, group=agent_type, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=not_human) + 
  stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=not_human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=not_human) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=human) + 
  stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=human) + 
  theme(legend.position=c(.5,.3), legend.box="horizontal") +
  coord_cartesian(ylim=c(0.6, 0.91)) +
  xlab("Condition") +
  ylab("Tutor Accuracy") +
  #ggtitle("Posttest Performance") +
  labs(color=agent_type, shape=agent_type) +
  scale_color_manual(values=brewer.pal(6, "Spectral")[c(5,1,6)])

# Blocked Learning Curves
human = subset(fa_data, condition == "Blocked" & agent_type == "Human")
not_human = subset(fa_data, condition == "Blocked" & agent_type != "Human")

ggplot(data=fa_data, aes(x=opp, y=1-correctness, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=not_human) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=not_human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=not_human) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=human) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=human) + 
  theme(legend.position=c(.8,.8), legend.box="horizontal") +
  xlim(1,22) +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Error") +
  ggtitle("Fraction Arithmetic - Blocked Condition") +
  scale_color_manual(values=brewer.pal(6, "Spectral")[c(5,1,6,1)])

# Interleaved Learning Curves
human = subset(fa_data, condition == "Interleaved" & agent_type == "Human")
not_human = subset(fa_data, condition == "Interleaved" & agent_type != "Human")

ggplot(data=fa_data, aes(x=opp, y=1-correctness, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=not_human) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=not_human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=not_human) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=human) + 
  #stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=human) + 
  theme(legend.position=c(.8,.8), legend.box="horizontal") +
  xlim(1,22) +
  labs(color=agent_type, shape=agent_type) + 
  xlab("# of Practice Opportunities") +
  ylab("Average Error") +
  ggtitle("Fraction Arithmetic - Interleaved Condition") +
  scale_color_manual(values=brewer.pal(6, "Spectral")[c(5,1,6,1)])

# Average all tutor performance within each student
avg_tutor <- aggregate(correctness ~ student + agent_type + condition, FUN=mean, data=fa_data)
not_human <- subset(avg_tutor, agent_type!="Human")
human <- subset(avg_tutor, agent_type=="Human")

avg_tutor_wide <- reshape(avg_tutor, idvar = c("student", "condition"), timevar = "agent_type", direction = "wide")
avg_tutor_wide <- avg_tutor_wide[complete.cases(avg_tutor_wide),]
cor(avg_tutor_wide$correctness.Human, avg_tutor_wide$correctness.Trestle)
cor(avg_tutor_wide$correctness.Human, avg_tutor_wide$`correctness.Decision Tree`)

ggplot(data=avg_tutor, aes(x=condition, y=correctness, group=agent_type, color=agent_type, shape=agent_type)) +
  stat_summary(fun.y = mean, geom = "line", size=1.5, alpha=0.7, data=not_human) + 
  stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, alpha=0.7, data=not_human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, alpha=0.7, data=not_human) + 
  
  stat_summary(fun.y = mean, geom = "line", size=1.5, data=human) + 
  stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width=0.025, data=human) + 
  stat_summary(fun.y = mean, geom = "point", size=4, data=human) + 
  theme(legend.position=c(.85,.3), legend.box="horizontal") +
  coord_cartesian(ylim=c(0.6, 0.91)) +
  xlab("Condition") +
  ylab("Tutor Accuracy") +
  #ggtitle("Posttest Performance") +
  labs(color=agent_type, shape=agent_type) +
  scale_color_manual(values=brewer.pal(6, "Spectral")[c(5,1,6)])

m.avg.human <- lm(correctness ~ condition, data=subset(avg_tutor, agent_type=="Human"))
m.avg.tres <- lm(correctness ~ condition, data=subset(avg_tutor, agent_type=="Trestle"))
m.avg.dt <- lm(correctness ~ condition, data=subset(avg_tutor, agent_type=="Decision Tree"))

# All three agent types exhibt the same effect of condition.
m.human <- glm(correctness ~ condition, data = subset(fa_data, agent_type == "Human"), family=binomial())
m.tres <- glm(correctness ~ condition, data = subset(fa_data, agent_type == "Trestle"), family=binomial())
m.dt <- glm(correctness ~ condition, data = subset(fa_data, agent_type == "Decision Tree"), family=binomial())


# However, there are problems when we take into account within student correlation
m.human <- glm(correctness ~ condition, data = subset(fa_data, agent_type == "Human"), family=binomial())
m.human2 <- glm(correctness ~ condition+opp, data = subset(fa_data, agent_type == "Human"), family=binomial())

m.human.mixed <- glmer(correctness ~ condition + (1|student), data = subset(fa_data, agent_type == "Human"), family=binomial())
m.human2.mixed <- glmer(correctness ~ condition*opp + (1+opp|kc) + (1|student), data = subset(fa_data, agent_type == "Human"), family=binomial())

m.tres.mixed <- glmer(correctness ~ condition + (1|student), data = subset(fa_data, agent_type == "Trestle"), family=binomial())
m.dt.mixed <- glmer(correctness ~ condition + (1|student), data = subset(fa_data, agent_type == "Decision Tree"), family=binomial())

m.mixed <- glmer(correctness ~ condition*agent_type + opp + (1+opp|kc) + (1|student), data = subset(fa_data, agent_type != "Decision Tree"), family=binomial())

