*******************************
Apprentice Learner Architecture
*******************************

.. image:: https://travis-ci.com/apprenticelearner/AL_Train.svg?branch=master
    :target: https://travis-ci.com/apprenticelearner/AL_Train

.. image:: https://coveralls.io/repos/github/apprenticelearner/AL_Train/badge.svg?branch=master
	:target: https://coveralls.io/github/apprenticelearner/AL_Train?branch=master

.. image:: https://readthedocs.org/projects/al-train/badge/?version=latest
	:target: https://al-core.readthedocs.io/projects/AL_Train/en/latest/?badge=latest
	:alt: Documentation Status

The Apprentice Learner Architecture provides a framework for modeling and simulating learners working educational technologies. There are three general GitHub repositories for the AL Project: 

1. **AL_Core** (https://github.com/apprenticelearner/AL_Core), which is the core library for learner modeling used to configure and instantiate agents and author their background knowledge. 
2. **AL_Train** (this respository), which contains code for interfacing AL agents with CTAT-HTML tutors and running training experiments.
3. **AL_Outerloop** (https://github.com/apprenticelearner/AL_Outerloop), which provides additional functionality to AL_Train simulating adaptive curricula.


This repository does the following:

1. Provides the `altrain` executable which is used to train Apprentice Learner agents from a training.json spec file, either in batch mode or interactively. 
2. Implements a host server with a `Datashop <https://pslcdatashop.web.cmu.edu/>`_ `logging language <https://github.com/CMUCTAT/CTAT/wiki/Logging-Documentation>`_ compatable logger which will write tab-delimited transaction files of AL agent actions.


Installation
============

To install the AL_Train library, first follow the installation instructions for the `AL_Core Library <https://github.com/apprenticelearner/AL_Core>`_. Next, `clone the respository <https://help.github.com/en/articles/cloning-a-repository>`_ to your machine using the GitHub deskptop application or by running the following command in a terminal / command line:

.. code-block:: bash

	git clone https://github.com/apprenticelearner/AL_Train


Navigate to the directory where you cloned AL_Train in a terminal / command line and run:

.. code-block:: bash

	python -m pip install -e .

Everything should now be fully installed and ready.

Important Links
===============

* Source code: https://github.com/apprenticelearner/AL_Train
* Documentation: https://al-core.readthedocs.io/en/latest/

Examples
========

We have created a number of examples to demonstrate basic usage of the Appentice Learner that make use of this repository as well as `AL_Core <https://github.com/apprenticelearner/AL_Core>`_. These can be found on the `examples page <https://github.com/apprenticelearner/AL_Core/wiki/Examples>`_ of the AL_Core wiki.

Citing this Software
====================

If you use the *interactive training* components of this software in a scientific publiction, then we would appreciate a citation of the following paper:

Daniel Weitekamp III, Erik Harpstead, and Kenneth R Koedinger. 2020. An Interaction Design for Machine Teaching to Develop AI Tutors. In Proceedings of the SIGCHI Conference on Human Factors in Computing Systems - CHI ’20,. https://doi.org/10.1145/3313831.3376226

Bibtex entry::
	
	@inproceedings{WeitekampIII2020,
	author = {{Weitekamp III}, Daniel and Harpstead, Erik and Koedinger, Kenneth R},
	booktitle = {Proceedings of the SIGCHI Conference on Human Factors in Computing Systems - CHI '20,},
	doi = {10.1145/3313831.3376226},
	file = {:C$\backslash$:/Users/eharpste/Documents/Articles/Weitekamp III, Harpstead, Koedinger - 2020 - An Interaction Design for Machine Teaching to Develop AI Tutors.pdf:pdf;:C$\backslash$:/Users/eharpste/Documents/Articles/Weitekamp III, Harpstead, Koedinger - 2020 - An Interaction Design for Machine Teaching to Develop AI Tutors(2).pdf:pdf},
	isbn = {9781450367080},
	keywords = {"Simulated Learners,Intelligent Tutoring Systems",Interaction Design,Machine Teaching,Programming-by-Demonstration},
	title = {{An Interaction Design for Machine Teaching to Develop AI Tutors}},
	year = {2020}
	}

If you use the broader Apprentice Learner Architecture in a scientific publication, then we would appreciate a citation of the following paper:


Christopher J MacLellan, Erik Harpstead, Rony Patel, and Kenneth R Koedinger. 2016. The Apprentice Learner Architecture: Closing the loop between learning theory and educational data. In Proceedings of the 9th International Conference on Educational Data Mining - EDM ’16, 151–158. Retrieved from http://www.educationaldatamining.org/EDM2016/proceedings/paper_118.pdf

Bibtex entry::

	@inproceedings{MacLellan2016a,
	author = {MacLellan, Christopher J and Harpstead, Erik and Patel, Rony and Koedinger, Kenneth R},
	booktitle = {Proceedings of the 9th International Conference on Educational Data Mining - EDM '16},
	pages = {151--158},
	title = {{The Apprentice Learner Architecture: Closing the loop between learning theory and educational data}},
	url = {http://www.educationaldatamining.org/EDM2016/proceedings/paper{\_}118.pdf},
	year = {2016}
	}
