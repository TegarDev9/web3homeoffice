#!/usr/bin/env bash
set -euxo pipefail

# Base VPS hardening + Docker bootstrap for Web3 Home Office.
# Supports Debian, Ubuntu, and Kali Linux.

if ! id -u web3ho >/dev/null 2>&1; then
  useradd -m -s /bin/bash web3ho
fi

if [[ ! -f /etc/os-release ]]; then
  echo "Missing /etc/os-release; cannot detect Linux distribution" >&2
  exit 1
fi

# shellcheck disable=SC1091
. /etc/os-release

OS_ID="${ID:-}"
OS_CODENAME="${VERSION_CODENAME:-}"

case "$OS_ID" in
  ubuntu)
    DOCKER_REPO="https://download.docker.com/linux/ubuntu"
    DOCKER_CODENAME="$OS_CODENAME"
    ;;
  debian)
    DOCKER_REPO="https://download.docker.com/linux/debian"
    DOCKER_CODENAME="$OS_CODENAME"
    ;;
  kali)
    DOCKER_REPO="https://download.docker.com/linux/debian"
    # Kali packages are aligned with Debian stable channels.
    if [[ -n "$OS_CODENAME" && "$OS_CODENAME" != "kali-rolling" ]]; then
      DOCKER_CODENAME="$OS_CODENAME"
    else
      DOCKER_CODENAME="bookworm"
    fi
    ;;
  *)
    echo "Unsupported distro '$OS_ID'. Supported: debian, ubuntu, kali." >&2
    exit 1
    ;;
esac

if [[ -z "$DOCKER_CODENAME" ]]; then
  echo "Unable to determine Docker codename for distro '$OS_ID'" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl fail2ban gnupg ufw

install -m 0755 -d /etc/apt/keyrings
curl -fsSL "$DOCKER_REPO/gpg" -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] $DOCKER_REPO $DOCKER_CODENAME stable" \
  > /etc/apt/sources.list.d/docker.list

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

