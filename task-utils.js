const { chain, uniq } = require('lodash');
const moment = require('moment');

function processTasks(tasks) {
    return chain(tasks)
        .map(task => {
            const start = moment(task.start);
            const duration = -start.diff(task.end, 'minutes');
            const name = task.description;

            return {
                startFormatted: start.format('DD-MM-YYYY'),
                start,
                duration,
                name
            };
        })
        .groupBy(task => task.startFormatted)
        .map(group => {
            return {
                date: group[0].start,
                dateFormatted: group[0].startFormatted,
                names: uniq(group.map(i => i.name)).join(', '),
                duration: group.map(i => i.duration).reduce((sum, i) => sum += i, 0)
            }
        })
        .sortBy(item => item.date.valueOf())
        .reverse()
        .reduce((acc, value) => {
            return acc += `${value.names};${value.dateFormatted};${Math.ceil(value.duration / 60)}\n`;
        }, '')
        .value();
}

module.exports = processTasks;
