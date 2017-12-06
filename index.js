const request = require('request');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2));
const Promise = require('bluebird');
const processTasks = require('./task-utils');

const since = argv.since || moment().add(-1, 'month').format('YYYY-MM-DD');
const until = argv.until || moment().format('YYYY-MM-DD');
const workspace = argv.wid;
const token = argv.token;
const outFile = argv.out || 'out.csv';

if (!workspace) {
    throw new Error('wid argument missing');
}

if (!token) {
    throw new Error('token argument missing');
}

const pRequest =  Promise.promisify(request.get);

const fileStream = fs.createWriteStream(outFile);

function togglRequest(page) {
    return pRequest(`https://toggl.com/reports/api/v2/details?workspace_id=${workspace}&since=${since}&until=${until}&user_agent=api_test&page=${page}`, {
        auth: {
            username: token,
            password: 'api_token'
        }
    }).then(response => {
        const details = JSON.parse(response.body);

        if (details.error) {
            throw new Error(details.error.message);
        }

        const total = details.total_count;
        const pageSize = details.per_page;

        const str = processTasks(details.data);

        fileStream.write(str);

        if (page * pageSize < total) {
            return togglRequest(page + 1);
        }
    })
}

togglRequest(1)
    .then(() => {
        fileStream.end();
        process.exit(0);
    })
    .catch(err => {
        fileStream.end();
        console.error(err);
        process.exit(1);
    });
