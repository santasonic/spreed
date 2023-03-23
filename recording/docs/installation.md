# Installation

The recording server can be installed using system packages in some GNU/Linux distributions. A "manual" installation is required for others.

## System packages

Distribution packages are supported for the following GNU/Linux distributions:
- Ubuntu 20.04
- Ubuntu 22.04

They can be built on those distributions by calling `make` in the _recording/packaging_ directory of the git sources. Alternatively, the packages can be built for those target distributions too on other distributions using Docker by calling `build.sh` in the _recording/packaging_ directory too.

The built packages include the recording server itself (_python3-nextcloud-talk-recording_) as well as the Python3 dependencies that are not included in the repositories of the distributions.

Once built the packages can be installed using the package managers of the distributions. Besides installing the recording server and its dependencies a _nextcloud-talk-recording_ user is created to run the recording server, and a systemd service is created to start the recording server when the machine boots.

### Ubuntu 22.04

In Ubuntu 22.04 the normal Firefox package was replaced by a Snap. Unfortunately the Snap package can not be used with the default packages, so the [PPA from Mozilla](https://launchpad.net/~mozillateam/+archive/ubuntu/ppa) needs to be setup instead before installing the packages:
```
add-apt-repository ppa:mozillateam/ppa
```

Besides that the Firefox package from the PPA needs to be configured to take precedence over the Snap one with:
```
echo '
Package: *
Pin: release o=LP-PPA-mozillateam
Pin-Priority: 1001
' | sudo tee /etc/apt/preferences.d/mozilla-firefox
```

## Manual installation

The recording server has the following non-Python dependencies:
- FFmpeg
- Firefox
- [geckodriver](https://github.com/mozilla/geckodriver/releases) (on a [version compatible with the Firefox version](https://firefox-source-docs.mozilla.org/testing/geckodriver/Support.html))
- PulseAudio
- Xvfb

Those dependencies must be installed, typically using the package manager of the distribution, in the system running the recording server.

Then, the recording server and all its Python dependencies can be installed using Python pip. Note that the recording server is not available in the Python Package Index (PyPI); you need to manually clone the git repository and then install it from there:
```
git clone https://github.com/nextcloud/spreed
python3 -m pip install spreed/recording
```

Note that in the example above the master branch is cloned; you might want to clone a specific tag or stable branch instead.

The recording server does not need to be run as root (and it should not be run as root). It can be started as a regular user with `python3 -m nextcloud.talk.recording --config {PATH_TO_THE_CONFIGURATION_FILE)`. Nevertheless, please note that the user needs to have a home directory.

You might want to configure a systemd service (or any equivalent service) to automatically start the recording server when the machine boots.

## System setup

### TLS termination proxy

The recording server only listens for HTTP requests. It is recommended to set up a TLS termination proxy (which can be just a webserver) to add support for HTTPS connections (similar to what is done [for the signaling server](https://github.com/strukturag/nextcloud-spreed-signaling#setup-of-frontend-webserver)).

### Firewall

Independently of the installation method, the recording server requires some dependencies that are not typically found in server machines, like Firefox. It is highly recommended to setup a firewall that prevents any access from the outside to the machine, except those strictly needed by the recording server (and, of course, any additional service that might be needed in the machine, like SSH).

The recording server acts similar to a regular participant in the call, so the firewall needs to allow access to the Nextcloud server and the HPB. These are the connections that need to be allowed from the recording server:
- Nextcloud server using HTTPS (TCP on port 443 of the Nextcloud server)
- HPB using HTTPS (TCP on port 443 of the signaling server).
  The HTTPS connection must be upgradeable to a WebSocket connection.
- HPB using UDP.
  The recording server connects to a port in the range 20000-40000 (or whatever range is configured in Janus, the WebRTC gateway), while the WebRTC gateway may connect on any port of the recording server.

Both the HPB and the recording server should be in the same internal network, although preferably not in the same machine to prevent their CPU load to affect each other.

Depending on the setup the recording might also need to access the STUN server and/or the TURN server, although typically it will not be needed (especially if both the HPB and the recording server can access each other in the same internal network).
