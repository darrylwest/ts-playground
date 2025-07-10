import fetch, { Request, Headers } from 'node-fetch';
import * as net from 'net';
import { URL } from 'url';
import * as path from 'path';

interface CustomResponse {
    ok: boolean;
    status: number;
    headers: Record<string, string>;
    text: () => Promise<string>;
    json: () => Promise<any>;
}

const unixFetch = async (url: string, options: any) => {
    // Parse URL format: http://unix:/path/to/socket:/endpoint
    const match = url.match(/^http:\/\/unix:(.+):(.+)$/);
    if (!match) {
        throw new Error('Invalid Unix socket URL format');
    }
    const socketPath = match[1];
    const path = match[2];

    return new Promise<CustomResponse>((resolve, reject) => {
        const client = net.connect(socketPath, () => {
            const requestHeaders = {
                ...options.headers,
                'Host': 'localhost', // Important for some servers
            };

            let requestBody = `${options.method} ${path} HTTP/1.1\r\n`;
            for (const header in requestHeaders) {
                requestBody += `${header}: ${requestHeaders[header]}\r\n`;
            }
            requestBody += 'Connection: close\r\n';
            requestBody += '\r\n';

            if (options.body) {
                requestBody += options.body;
            }

            client.write(requestBody);
        });

        let responseData = '';

        client.on('data', (data) => {
            responseData += data.toString();
        });

        client.on('end', () => {
            const [headersStr, body] = responseData.split('\r\n\r\n', 2);
            const headers = headersStr.split('\r\n').reduce((acc: Record<string, string>, line) => {
                const [key, value] = line.split(': ');
                if (key && value) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const statusCode = parseInt(headersStr.split(' ')[1], 10);

            const response: CustomResponse = {
                ok: statusCode >= 200 && statusCode < 300,
                status: statusCode,
                headers: headers,
                text: async () => body,
                json: async () => JSON.parse(body),
            };

            resolve(response);
        });

        client.on('error', (err) => {
            reject(err);
        });
    });
};

async function makeRequest(endpoint: string, method: string = 'GET', data: any = null) {
    // const socketPath = '/tmp/ts-app.sock'; // Replace with your socket path
    // const socketPath: string = path.join(__dirname, '../dist/app.sock');
    const socketPath: string = '/Users/dpw/raincity/web-projects/ts-playground/unix-sockets/dist/app.sock';
    const url = `http://unix:${socketPath}:${endpoint}`;

    console.log(url);

    const options: any = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await unixFetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch:', error);
        throw error;
    }
}

async function testEndpoints() {
    try {
        // Example 1: GET request
        let data = await makeRequest('/ping');
        console.log('GET Response:', data);

        data = await makeRequest('/date');
        console.log('GET Response:', data);

        data = await makeRequest('/time');
        console.log('GET Response:', data);

        data = await makeRequest('/iso');
        console.log('GET Response:', data);

        // Example 2: POST request
        // const postData = { key: 'value' };
        // const postResponse = await makeRequest('/your/post/endpoint', 'POST', postData);
        // console.log('POST Response:', postResponse);

        // Add more test cases as needed
    } catch (error) {
        console.error('E2E Test Failed:', error);
    }
}

testEndpoints();
