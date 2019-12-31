import 'whatwg-fetch';

type Options = {
    [index: string]: any,
    samples: number,
    downloadUrl: string | Function
    pingUrl: string,
    uploadUrl: string,
    blobSize: number,
}

type RequestConfig = {
    url: string,
}

type Speed = {
    bps: number,
    human: string
}

type LinkSpeedResult = {
    rtt: number,
    down: Speed,
    up: Speed
}

const defaults: Options = {
    samples: 5,
    downloadUrl: (options: Options) => `https://linkspeed.voror.workers.dev/blob/${options.blobSize}`,
    pingUrl: 'https://linkspeed.voror.workers.dev/empty',
    uploadUrl: 'https://linkspeed.voror.workers.dev/upload',
    blobSize: 4194304
}

async function request(config: RequestConfig): Promise<void> {
    const res = await fetch(config.url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    await res.arrayBuffer();
}

async function avgPerf(fn: Function, noOfSamples: number): Promise<number> {
    const samples = [];
    for (let i = 0; i < noOfSamples; i++) {
        let startTime = performance.now();
        await fn();
        samples.push(performance.now() - startTime);
    }

    const total = samples.reduce((acc, sample) => acc + sample, 0);
    return total / noOfSamples;
}

function getUrl(key: string, options: Options): string {
    let url = '';

    if (typeof options[key] === 'function') {
        url = options[key](options);
    } else {
        url = options[key];
    }

    return url;
}

function humanReadable(bytes: number, seconds: number): string {
    const units = [' bps', ' kbps', ' Mbps', ' Gbps', ' Tbps', 'Pbps', 'Ebps', 'Zbps', 'Ybps'];

    let speed = seconds ? bytes * 8 / seconds : 0;
    let unitNum = 0;
    while (speed > 1024) {
        speed = speed / 1024;
        unitNum++;
    }
    return Math.max(speed, 0.1).toFixed(1) + units[unitNum];
}

function calculateSpeed(size: number, seconds: number): Speed {
    const bps = size / seconds;
    const human = humanReadable(size, seconds);
    return { bps, human };
}

async function ping(options: Options): Promise<number> {
    return avgPerf(async () => {
        await request({ url: options.pingUrl });
    }, options.samples);
}

async function download(options: Options): Promise<Speed> {
    const url = getUrl('downloadUrl', options);

    const avgDl = await avgPerf(async () => {
        await request({ url });
    }, options.samples);

    return calculateSpeed(options.blobSize, avgDl / 1000);
}

async function upload(options: Options): Promise<Speed> {
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

export default async (options?: Partial<Options>): Promise<LinkSpeedResult> => {
    const opts = Object.assign({ ...defaults }, options);
    const rtt = await ping(opts);
    const dl = await download(opts);
    const up = await upload(opts);

    return { rtt, down: dl, up };
};