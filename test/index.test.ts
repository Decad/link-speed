import linkSpeed from '../src/index';

jest.mock('axios');

test('Some Test', async () => {
    await linkSpeed({ samples: 5 });
});