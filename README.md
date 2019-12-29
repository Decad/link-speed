# ⚡ Link Speed

Measure your current network speed, designed to be used in a browser for testing users internet connections.

# Install

```
$ npm i link-speed
```

# Usage

Link speed is designed to be simple to use and easy to integrate.

```javascript
await linkSpeed();
```

#### Example output

```javascript
  {
      rtt: 197.46177999999995, // roundtrip time in ms
      down: { bps: 4332332.1893323045, human: '33.1 Mbps' },
      up: { bps: 972811.3236568089, human: '7.4 Mbps' }
  }
```

# Options

```javascript
await linkSpeed({ ...options });
```

#### Defaults

```javascript
{
    samples: 5,
    downloadUrl: (options: Options) => `https://linkspeed.voror.workers.dev/blob/${options.blobSize}`,
    pingUrl: 'https://linkspeed.voror.workers.dev/empty',
    uploadUrl: 'https://linkspeed.voror.workers.dev/upload',
    blobSize: 4194304
}
```

# Server

Link speed defaults to using a [server implementaion](https://github.com/Decad/link-speed-server) deployed to cloudflare as a worker, the server is provided to ensure that this package is simple to use and doesn't require any server setup like other packages.

Cloudflare workers are globally distributed meaning that this package will meaure the link between you and the cloudflare network. This has the benefit of giving you a meaningful measurement for the link speed for a site thats behind a CDN / on the cloudflare network, however it can cause the results to be incorrect if you wish to measure the speed between you and your specific network configuration or an private resource. See [Options](#options) for ways to configure this.

# Licence

MIT