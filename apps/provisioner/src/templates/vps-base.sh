#!/usr/bin/env bash
set -euxo pipefail

# Base VPS hardening + Docker bootstrap for Web3 Home Office.

if ! id -u web3ho >/dev/null 2>&1; then
  useradd -m -s /bin/bash web3ho
fi

apt-get update
apt-get install -y --no-install-recommends ca-certificates curl ufw fail2ban

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y --no-install-recommends docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

usermod -aG docker web3ho

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw --force enable

sed -i 's/^#*PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd

systemctl enable docker
systemctl start docker
systemctl enable fail2ban
systemctl restart fail2ban


