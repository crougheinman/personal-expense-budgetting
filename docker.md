# Docker for Windows Install (without Docker Desktop)

![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)

Get the latest docker binaries from: https://download.docker.com/win/static/stable/x86_64/

unzip the binaries to a directory and add it to PATH.

You may also install it using chocolatey:

```batch
choco install docker-cli
choco install docker-compose
```

Install Ubuntu via Windows Linux Subsystem:

```ps1
wsl --install -d ubuntu
```

Check it:

```batch
wsl -l -v
```

If its not version 2,

```batch
wsl --set-version ubuntu 2
```

in **Ubuntu**'s shell:

```bash
sudo apt-get update
sudo apt install -yqq fontconfig daemonize
sudo vi /etc/profile.d/00-wsl2-systemd.sh
```

paste the following contents.

```sh
SYSTEMD_PID=$(ps -efw | grep '/lib/systemd/systemd --system-unit=basic.target$' | grep -v unshare | awk '{print $2}')

if [ -z "$SYSTEMD_PID" ]; then
   sudo /usr/bin/daemonize /usr/bin/unshare --fork --pid --mount-proc /lib/systemd/systemd --system-unit=basic.target
   SYSTEMD_PID=$(ps -efw | grep '/lib/systemd/systemd --system-unit=basic.target$' | grep -v unshare | awk '{print $2}')
fi

if [ -n "$SYSTEMD_PID" ] && [ "$SYSTEMD_PID" != "1" ]; then
    exec sudo /usr/bin/nsenter -t $SYSTEMD_PID -m -p su - $LOGNAME
fi

```

install docker on Ubuntu 22.04.x LTS:

```shell
cd ~
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

select option #1 (iptables-legacy)

```shell
sudo update-alternatives --config iptables
```

On **Windows**, resart the ubuntu shell.

```bat
wsl --shutdown
wsl
```

set startup items

```shell
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
```

Expose the daemon on the Linux Subsystem:

```shell
sudo cp /lib/systemd/system/docker.service /etc/systemd/system/
sudo sed -i 's/\ -H\ fd:\/\//\ -H\ fd:\/\/\ -H\ tcp:\/\/127.0.0.1:2375/g' /etc/systemd/system/docker.service
sudo systemctl daemon-reload
sudo systemctl restart docker.service
```

On **Windows**, create a context to use:

```batch
docker context create ubuntu-subsystem --docker host=tcp://127.0.0.1:2375
```

verify:

```batch
docker context ls
```

set the context

```batch
docker context use ubuntu-subsystem
```

or just set the environment:

```batch
set DOCKER_CONTEXT=ubuntu-subsystem
```

Docker ready!

## notes

- uninstalling:

```bat
wsl --unregister ubuntu
```

- If Ubuntu stops responding properly (and shutdown doesnt work), you can go to services, look for LxssManager. Start/stop/restart/reconfigure as desired.
- The LxssManager service starts automatically whenever you run the Ubuntu (or any installed Linux Subsystem) App.
- Shutdown WSL to free up memory

```bat
wsl --shutdown
```

- To free up disk space, compress the Ubuntu's virual disk (usually in `%USERPROFILE%\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu_79rhkp1fndgsc\LocalState\ext4.vhdx`)

```bat
wsl --shutdown
diskpart
```

in diskpart prompt:

```
select vdisk file=<path-to-vxhd>
attach vdisk readonly
compact vdisk
detach vdisk
exit
```

- To limit ram usage, write the following to `%USERPROFILE%\.wslconfig` then restart LxssManager.

```ini
[wsl2]
memory=4GB # Limits VM memory in WSL 2 to 4 GB
processors=5 # Makes the WSL 2 VM use two virtual processors
```

- if wsl refuses to start after shutdown (as admin) run,

```cmd
powershell -command "Get-Service vmcompute | Restart-Service"
```