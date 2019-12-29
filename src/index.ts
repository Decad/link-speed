import 'whatwg-fetch';

interface Options {
    [index: string]: any,
    samples: number,
    downloadUrl: string | Function
    pingUrl: string,
    uploadUrl: string,
    blobSize: number,
}

interface RequestConfig {
    url: string,
}

const defaults: Options = {
    samples: 5,
    downloadUrl: (options: Options) => `https://linkspeed.voror.workers.dev/blob/${options.blobSize}`,
    pingUrl: 'https://linkspeed.voror.workers.dev/empty',
    uploadUrl: 'https://linkspeed.voror.workers.dev/upload',
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

function getUrl(key: string, options: Options) {
    let url = '';

    if (typeof options[key] === 'function') {
        url = options[key](options);
    } else {
        url = options[key];
    }

    return url;
}

function calculateSpeed(size: number, seconds: number) {
    const bps = size / seconds;
    const human = humanReadable(size, seconds);
    return { bps, human };
}

async function ping(options: Options) {
    return avgPerf(async () => {
        await request({ url: options.pingUrl });
    }, options.samples);
}

async function download(options: Options) {
    const url = getUrl('downloadUrl', options);

    const avgDl = await avgPerf(async () => {
        await request({ url });
    }, options.samples);

    return calculateSpeed(options.blobSize, avgDl / 1000);
}

async function upload(options: Options) {
    const url = getUrl('uploadUrl', options);

    const avgUp = await avgPerf(async () => {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            body: new Uint8Array(options.blobSize / Uint8Array.BYTES_PER_ELEMENT)
        });
    }, options.samples);

    return calculateSpeed(options.blobSize, avgUp / 1000);
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
    const up = await upload(opts);

    return { rtt, down: dl, up };
};