sudo apt-get update
sudo apt-get install libpython3.11-dev

# Install nginx
apt-get install nginx-light

# Add nginx config
cd /etc/nginx/sites-available/
cat << EOF > ai2t.site
server {
    listen 80;
    listen [::]:80;
    server_name ai2t.site www.ai2t.site;
    root /root/Projects/AL_Train/altrain_interface;

    location /agent {
      proxy_pass http://localhost:8001;
      proxy_set_header Host $http_host;
      proxy_redirect off;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
      client_max_body_size 20m;
    }

    location / {
      proxy_pass http://localhost:8000;
      proxy_set_header Host $http_host;
      proxy_redirect off;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
      client_max_body_size 20m;
   }
}
EOF
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/ai2t.site .
sudo service nginx reload
sudo service nginx enable
cd ~

# Setup Firewall: allow ports 8000 8001
sudo ufw allow 'Nginx Full'
sudo ufw allow 8000
sudo ufw allow 8001
sudo ufw allow OpenSSH
sudo ufw enable

# install, create, and activate virtual environment
sudo apt install python3-pip
sudo apt-get install venv
python3 -m venv env
source env/bin/activate

# Clone repos and install dependencies
pip install numba=0.58.1
pip install pytest-benchmark

cd ~
sudo mkdir Projects
cd ~/Projects

git clone https://github.com/DannyWeitekamp/Cognitive-Rule-Engine
git clone https://github.com/DannyWeitekamp/tutorenvs
git clone https://github.com/apprenticelearner/AL_Core
git clone https://github.com/apprenticelearner/AL_Train
cd Cognitive_Rule_Engine
pip install -e .
cd ~/Projects
cd AL_Core
pip install -e .
cd ~/Projects

# Install npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/
nvm install npm

# Install and build AL_Train
cd ~/Projects/AL_Train
pip install -e .
cd altrain_interface
npm install
npm run build


cd ~/Projects/tutorenvs
pip install -e .
cd sandbox/multicolumn
python run_al.py

# cd ~/Projects/AL_Train/examples
# altrain author_mc.json --browser=none --al-host=ai2t.site --ctat-host=ai2t.site --al-port=8001 --ctat-port=8000





