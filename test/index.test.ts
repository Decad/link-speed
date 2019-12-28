import linkSpeed from '../src/index';

jest.setTimeout(1000 * 60);

test('Some Test', async () => {
    const result = await linkSpeed();
    console.log(result);
});