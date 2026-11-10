
//clone  firts   
git clone https://github.com/imbitheesther-art/restpoint.git



//on server   
sudo apt update
sudo apt upgrade -y


//install all depedencies  


1. ca-certificates
Provides trusted security certificates.

Allows your server to verify secure HTTPS connections.

Helps ensure downloads from Docker's official website are trusted.

2. curl
A command-line tool for downloading data from URLs.

Docker installation uses it to download Docker's GPG signing key.

sudo apt install ca-certificates curl gnupg -y



 3. Add Docker's official GPG key


sudo install -m 0755 -d /etc/apt/keyrings

sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
-o /etc/apt/keyrings/docker.asc 

sudo chmod a+r /etc/apt/keyrings/docker.asc


//Dcoker   Repository 
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null




//install  docker  
sudo apt update

sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

//  Start  Docker   
sudo systemctl start docker
sudo systemctl enable docker


//  install make   and  nginix  
sudo apt update
sudo apt install make -y  


sudo apt install nginx -y 

sudo systemctl start nginx 

sudo systemctl enable nginx
sudo apt update

sudo apt install -y \
make \
nginx \
curl \
ca-certificates \
gnupg 

// Before building, update the checkout so it includes the build helper used by Makefile.
cd /opt/restpoint
git pull --ff-only
test -f scripts/list-build-services.sh

// If the test fails, this checkout is missing the required helper. Update to the commit
// that adds it, then retry:
make build