# AL_HTML

A bridge between the [Apprentice Learner Framework](https://github.com/apprenticelearner/AL_Core) and various tutoring systems (for now just CTAT). This repository does the following:

1. Provides the `altrain` executable which is used to train Apprentice Learner agents from a training.json spec file, either in batch mode or interactively. 
2. Implements a host server with a [Datashop](https://pslcdatashop.web.cmu.edu/) [logging language](https://github.com/CMUCTAT/CTAT/wiki/Logging-Documentation) compatable logger which will write tab-delimited transaction files of AL agent actions.


This is hosted here: https://github.com/apprenticelearner/AL_HTML
Core Apprentice Learner code is here: https://github.com/apprenticelearner/AL_Core

Installation 

1. In your terminal/command prompt clone somewhere.
```bash
git clone https://github.com/apprenticelearner/AL_HTML
```
2. pip install
```bash
pip install -e AL_HTML
```

If it worked you should be able to run the following example:
```bash
altrain AL_HTML/examples/example_training.json
```
