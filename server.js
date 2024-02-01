const http = require('http');
const https = require('https');

function httpGetRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, response => {
            let body = '';
            response.on('data', data => (body += data));
            response.on('end', () => resolve(body));
        }).on('error', error => reject(error));
    });
}

function parseTimeStories(html) {
    const liRegex = /<li class="latest-stories__item">([\s\S]*?)<\/li>/g;

    // Regular expressions to extract title and link from <h3> and <a> tags
    const titleRegex = /<h3 class="latest-stories__item-headline">([\s\S]*?)<\/h3>/;
    const linkRegex = /<a[^>]*?href=["'](.*?)["']/;
    
    // Array to store extracted data
    const stories = [];
    
    // Extract <li> tags
    const liMatches = html.match(liRegex);
    // Iterate over matched <li> tags
    for (const liTag of liMatches) {
        // Extract title from <h3>
        const titleMatch = liTag.match(titleRegex);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Extract link from <a>
        const linkMatch = liTag.match(linkRegex);
        const link = linkMatch ? `https://www.time.com${linkMatch[1].trim()}` : '';

        // Push the extracted data to the array
        stories.push({ title, link });
    }
    return stories;
}


const server = http.createServer((req, res) => {
    if (req.url === '/getTimeStories' && req.method === 'GET') {
        httpGetRequest('https://time.com')
            .then(html => {
                const stories = parseTimeStories(html);
                sendResponse(res, 200, stories);
            })
            .catch(error => {
                console.error('Error fetching or parsing HTML:', error);
                sendResponse(res, 500, {
                    msg: 'Encountered Server Error',
                    code: 500
                });
            });
    } else {
        sendResponse(res, 404, {
            msg: 'The requested URL was not found',
            code: 404
        });
    }
});

function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(data, null, 2));
    res.end();
}

const port = '8080';
server.listen(port, () => {
    console.log(`Listening at port ${port}`);
    console.log(`Visit http://localhost:${port}/getTimeStories`);
});
