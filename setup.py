from setuptools import setup, find_packages 
  
with open('requirements.txt') as f: 
    requirements = f.readlines() 
  
long_description = '...need to add description' 
  
setup( 
        name ='al_train', 
        version ='0.5.7', 
        author ='Daniel Weitekamp', 
        author_email ='weitekamp@cmu.edu', 
        url ='https://github.com/apprenticelearner/AL_Train', 
        description ='Runs Apprentice Learner agents against in tutors.', 
        long_description = long_description, 
        long_description_content_type ="text/markdown", 
        license ='MIT', 
        packages = find_packages(), 
        # scripts=['bin/altrain'],
        # entry_points ={ 
            
        # }, 
        entry_points={
            "console_scripts": [
                "altrain = al_hostserver.altrain:pre_main"
            ]
        },
        classifiers =( 
            "Programming Language :: Python :: 3", 
            "License :: OSI Approved :: MIT License", 
            "Operating System :: OS Independent", 
        ), 
        keywords ='apprentice learner training harness', 
        install_requires = requirements, 
        zip_safe = False
) 