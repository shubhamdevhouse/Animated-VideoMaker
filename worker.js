const { Worker } = require('worker_threads');
let amqp = require('amqplib/callback_api');
let totalLimit = 0;
const processFrames = function (date, id, commands, windex, wind, limit, channel, msg, isWorkDone, currentIndex) {
    if (!isWorkDone) {
        for (let ie = currentIndex; ie < limit; ie++) {
            runAgain = false;
            if (ie >= commands.length) { return; }
            new Promise((resolve, reject) => {
                const port = new Worker(('./workerChild.js'), {
                    workerData: { name: commands[ie].name, cmd: commands[ie].cmd }
                });
                port.on('message', (data) => {
                    if (data != null && typeof (data) !== 'undefined' && data.toString().includes("error/convert.c")) {
                        channel.sendToQueue(msg.properties.replyTo,
                            Buffer.from(JSON.stringify({ status: 'error', id: id, message: "Incorrect data" })), {
                            correlationId: msg.properties.correlationId
                        });
                        channel.ack(msg);
                        isWorkDone = true;
                    }
                });
                port.on('error', reject);
                port.on('exit', (code) => {
                    console.log(wind, windex, currentIndex, limit);
                    currentIndex++;
                    if (wind == windex - 2) {
                        if (currentIndex * (wind + 1) >= limit * (wind + 1)) {
                            wind++;
                            date = new Date();
                            processFrames(date, id, commands, windex, wind, commands.length, channel, msg, isWorkDone, currentIndex);
                        }
                    } else if (wind < windex - 2) {
                        if (currentIndex * (wind + 1) >= limit * (wind + 1)) {
                            limit += totalLimit;
                            wind++;
                            date = new Date();
                            processFrames(date, id, commands, windex, wind, limit, channel, msg, isWorkDone, currentIndex);
                        }
                    }
                    if (currentIndex >= commands.length) {
                        channel.sendToQueue(msg.properties.replyTo,
                            Buffer.from(JSON.stringify({ status: 'success', id: id })), {
                            correlationId: msg.properties.correlationId
                        });
                        channel.ack(msg);
                        isWorkDone = true;
                        return;
                    }
                    if (code !== 0)
                        reject(new Error(`Worker stopped with exit code ${code}`));
                });
            });
        }
    }
}
function worker() {
    currentIndex = 0;
    amqp.connect('amqp://localhost', function (error, connection) {
        connection.createChannel(function (error, channel) {
            let queue = 'render_cmd_dev';
            channel.assertQueue(queue, {
                durable: false
            });
            channel.prefetch(1);
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
            channel.consume(queue, function reply(msg) {
                let content = JSON.parse(msg.content.toString());
                
                if(typeof(content.commands)!=='undefined'){
                console.log(content);
                totalLimit = content.tLimit;
                let commands = content.commands;
                let id = content.id;
                let date = content.date;
                let isWorkDone = false;
                let windex = content.commands.length < totalLimit ? 1 : parseInt(content.commands.length / totalLimit)
                if (windex == 1) {
                    channel.ack(msg);
                } else {
                    console.log("RUN", windex, date, id, windex, 0, totalLimit)
                    processFrames(date, id, commands, windex, 0, totalLimit, channel, msg, isWorkDone, currentIndex);
                }
            } else {  
                channel.ack(msg);
            }
            });


        });
    });
}
module.exports = worker