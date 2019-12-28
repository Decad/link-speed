import 'whatwg-fetch';

interface Options {
    samples: number,
    url: string | Function
    pingUrl: string,
    blobSize: number,
}

interface RequestConfig {
    url: string,
}

const defaults: Options = {
    samples: 5,
    url: (options: Options) => `https://linkspeed.voror.workers.dev/blob/${options.blobSize}`,
    pingUrl: 'https://linkspeed.voror.workers.dev/empty',
    blobSize: 4194304
}

async function request(config: RequestConfig) {
    const res = await fetch(config.url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    await res.arrayBuffer();
}

async function avgPerf(fn: Function, noOfSamples: number) {
    const samples = [];
    for (let i = 0; i < noOfSamples; i++) {
        let startTime = performance.now();
        await fn();
        samples.push(performance.now() - startTime);
    }

    const total = samples.reduce((acc, sample) => acc + sample, 0);
    return total / noOfSamples;
}

async function ping(options: Options) {
    return avgPerf(async () => {
        await request({ url: options.pingUrl });
    }, options.samples);
}

async function download(options: Options) {
    let url = '';

    if (typeof options.url === 'function') {
        url = options.url(options);
    } else {
        url = options.url;
    }

    const avgDl = await avgPerf(async () => {
        await request({ url });
    }, options.samples);

    const bps = options.blobSize / (avgDl / 1000);
    const humanDl = humanReadable(options.blobSize, avgDl / 1000);

    return { bps, humanDl };
}

function humanReadable(bytes: number, seconds: number) {
    const units = [' bps', ' kbps', ' Mbps', ' Gbps', ' Tbps', 'Pbps', 'Ebps', 'Zbps', 'Ybps']

    let speed = seconds ? bytes * 8 / seconds : 0
    let unitNum = 0
    while (speed > 1024) {
        speed = speed / 1024
        unitNum++
    }
    return Math.max(speed, 0.1).toFixed(1) + units[unitNum]
}

export default async (options?: Partial<Options>) => {
    const opts = Object.assign({ ...defaults }, options);
    const rtt = await ping(opts);
    const dl = await download(opts);

    return { rtt, ...dl };
};