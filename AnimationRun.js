const Utils = require('./utils');
const Config = require('./config');
const sizeOf = require('image-size')
const { Worker } = require('worker_threads');
const fs = require('fs');
const Url = require('url').URL;
const path = require("path");
const events = require('events');
const Text = require('./classes/Text.js');
events.EventEmitter.prototype._maxListeners = 100;
if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
};

class AnimationRun {
    constructor(name) {
        this.animationName = name;
        this.startTime = null;
        this.totalLimit = 10;
        this.local_filename = Config.audio;
        this.queue = 'render_cmd_dev';
        this.global_data = {};
        this.isDebug = true;
        this.which = -1;
        this.subFont = Config.roboto_light;
        this.currentIndex = 0;
        this.fontBold = Config.roboto_bold;
        this.mainWidth = Config.hdWidth;
        this.mainHeight = Config.hdHeight;
        this.mainTextClass = new Text(Config.roboto_bold_metric);
        this.subTextClass = new Text(Config.roboto_light_metric);
    }

    runAnimation = async function (id, isPreview) {
        try {
            this.init(id, isPreview);
            let users = Config.users;
            users[id].iWidth = Config.hdWidth;
            users[id].iHeight = Config.hdHeight;
            await this.parseJSON(id);
        } catch (e) {
            console.log(e);
            let users = Config.users;
            let obj = new Object()
            obj.socket = users[id].socket
            if (!isPreview) {
                obj.data = {
                    'status': 'error', videos_progress: { '360p': users[id].p_360, '480p': users[id].p_480, '720p': users[id].p_720, '1080p': users[id].p_1080 }
                    , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': 'none' }
                }
            } else {
                obj.data = {
                    'status': 'error',
                    'is_preview': 'false'
                    , video_url: { url: 'none' }
                }
            }
            users[id].eventEmitter.emit('onProgress', obj);
        }
    }

    init = function (id, isPreview) {
        let user = Config.users[id];
        let offY = 0;
        let offX = 0;
        let offYFirst = 0;
        user.disconnect = false;
        user.eventEmitter = new events.EventEmitter();
        user.eventEmitter.setMaxListeners(0);
        user.eventEmitter.on('onProgress', function (dataValue) {
            let sc = dataValue.socket;
            let data = dataValue.data;
            sc.emit('status', data);
            if (typeof (data.status) !== "undefined" && (data.status == "error" || data.status == "completed")) {
                user.disconnect = true;
                sc.disconnect();
                user.eventEmitter.removeAllListeners();
                Config.users.splice(id, 1);
                user = null;
            }
        });
        if (user.animation_style == "bulletin") {
            offY = 60;
            offX = 100;
            offYFirst = 60;
        } else if (user.animation_style == "hiRise") {
            offY = 200;
            offX = 195;
            offYFirst = 100;
        } else if (user.animation_style == "blankslate") {
            offY = 100;
            offX = 105;
            offYFirst = 60;
        } else if (user.animation_style == "standout") {
            offY = 100;
            offX = 105;
            offYFirst = 60;
        }

        user.croppedHeight = Config.previewHeight;
        user.croppedWidth = Config.previewWidth;
        if (!isPreview) {
            user.croppedHeight = Config.hdHeight;
            user.croppedWidth = Config.hdWidth;
        }
        user.commands = [];
        user.total_sec = 0;
        user.current_audio_index = 0;
        user.command = 0;
        user.totalVideos = 0;
        user.processedVideos = 0;
        user.total_videos_completed = 0;
        user.p_360 = 0;
        user.p_480 = 0;
        user.p_720 = 0;
        user.p_1080 = 0;
        user.isPreview = isPreview;
        user.offsetY = (offY / Config.hdHeight) * user.iHeight;
        user.maxHeightBound = ((Config.hdHeight - offYFirst) / Config.hdHeight) * user.iHeight;
        user.maxHeightStart = ((offYFirst) / Config.hdHeight) * user.iHeight;
        user.maxWidthBound = ((Config.hdWidth - offX) / Config.hdWidth) * user.iWidth;
        user.maxWidthBoundCrop = ((Config.hdWidth - offX) / Config.hdWidth) * user.iWidth;
        user.maxFirstCrop = (offX / Config.hdWidth) * user.iWidth;
        user.startTime = new Date();
        if (user.isPreview) {
            user.iWidth = Config.hdWidth;
            user.iHeight = Config.hdHeight;
            user.offsetY = (offY / Config.hdHeight) * user.iHeight;
            user.maxHeightBound = ((Config.hdHeight - offYFirst) / Config.hdHeight) * user.iHeight;
            user.maxHeightStart = ((offYFirst) / Config.hdHeight) * user.iHeight;
            user.maxFirstCrop = (offX / Config.hdWidth) * user.iWidth;
            user.maxWidthBound = (((Config.hdWidth - offX)) / Config.hdWidth) * user.iWidth;
            user.maxWidthBoundCrop = (((Config.hdWidth - offX)) / Config.hdWidth) * user.iWidth;
        }
    }

    parseJSON = async function (id) {
        let user = Config.users[id];
        let pathJSON = Config.output_directory + id + path.sep + "data" + path.sep + "data.json";
        let data = await Utils.readFile(pathJSON);
        user.json = JSON.parse(data);
        let global = user.json['global'];
        user.animation_style = global['style'];
        this.global_data.font = global['font'];
        this.global_data.background_music = global['backgroundMusic'];
        this.global_data.source = this.global_data.background_music['source'];
        this.global_data.volume = this.global_data.background_music['volume'];
        this.global_data.loop = this.global_data.background_music['loop'];
        this.global_data.isTrim = this.global_data.background_music['trimAudio']['trim'];
        if (this.global_data.isTrim) {
            this.global_data.trimValueStart = global['trimAudio']['value']['start'];
            this.global_data.trimValueEnd = global['trimAudio']['value']['end'];
        }
        if (this.global_data.source == "require(\"../assets/audio/o.mp3\")") {
            this.global_data.local_src = local_filename;
        } else {
            let parsed = new Url(this.global_data.source);
            this.global_data.local_src = Config.output_directory + id + path.sep + "data" + path.sep + path.basename(parsed.pathname);
            await this.download(id, this.global_data.source, this.global_data.local_src);
            if (!fs.existsSync(this.global_data.local_src)) {
                this.global_data.local_src = local_filename;
            }
        }
        await this.getMedias(user.json, id, user.animation_style);
        for (let gf = 1; gf < user["blockList"].length + 1; gf++) {
            let directory = Config.output_directory + id + path.sep + "data" + path.sep + "frames" + gf;
            await this.createDirectory(directory);
        }
        for (let blockIndex = 0; blockIndex < user["blockList"].length; blockIndex++) {
            user.blocksData = user.json["blocks"];
            user["blockList"][blockIndex].timing = parseFloat(user["blockList"][blockIndex].timing);
            if (user.animation_style == "hiRise") {
                user.total_sec += parseInt(user["blockList"][blockIndex].timing);
            } else if (user.animation_style == "standout") {
                user.total_sec += parseInt(user["blockList"][blockIndex].timing) - 0.2
            } else {
                user.total_sec += parseInt(user["blockList"][blockIndex].timing)
            }
            if (user["blockList"][blockIndex].type == "logoImage" || user["blockList"][blockIndex].type == "photo burst" || user["blockList"][blockIndex].type == "logoVideo" || user["blockList"][blockIndex].type == "logoText") {

            }
            else {
                user["blockList"][blockIndex].background_settings.color = user.blocksData[blockIndex]["background"]["color"]
            }
            user["blockList"][blockIndex].text = [];
            if (user["blockList"][blockIndex].type == "logoImage" || user["blockList"][blockIndex].type == "logoVideo" || user["blockList"][blockIndex].type == "logoText") {
                user["blockList"][blockIndex].alignV = "bottom";
                user["blockList"][blockIndex].alignH = "center";
            }
            user.textObject = new Object();
            let element = user.blocksData[blockIndex]["text"]["title"];
            user.textObject.text = element["content"];
            user.textObject.fontSize = element["fontSize"];
            user.textObject.type = "mainText";
            user.textObject.color = element["color"];
            user["blockList"][blockIndex].text.push(user.textObject);
            element = user.blocksData[blockIndex]["text"]["subTitle"];
            user.textObject = new Object();
            user.textObject.text = element["content"];
            user.textObject.fontSize = element["fontSize"];
            user.textObject.type = "subText";
            user.textObject.color = element["color"];
            user["blockList"][blockIndex].text.push(user.textObject);
            user["blockList"][blockIndex].legibility = user.blocksData[blockIndex]["text"]["legibility"];
            user["blockList"][blockIndex].legibilityColor = user.blocksData[blockIndex]["text"]["legibilityColor"];
            user["blockList"][blockIndex].accent = user.blocksData[blockIndex]["text"]["accent"];
        }
    }
    //Processing video function to add width / height & resize if needed
    processVideo = async function (blockJsonObj, blockDataObj, id, i) {
        let users = Config.users;
        users[id].totalVideos++;
        let dimen = null
        try {
            dimen = await Utils.getVideoSize(blockDataObj.url)
        } catch (e) {
            console.log(e);
            let obj = new Object()
            obj.socket = users[id].socket
            if (!users[id].isPreview)
                obj.data = {
                    'status': 'error', videos_progress: { '360p': 0, '480p': 0, '720p': 0, '1080p': 0 }
                    , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': 'none' }
                }
            else
                obj.data = {
                    'status': 'error',
                    'is_preview': 'false'
                    , video_url: { url: 'none' }
                };

            users[id].eventEmitter.emit('onProgress', obj);
            return;
        }
        blockDataObj.width = dimen.width
        blockDataObj.height = dimen.height
        if (blockDataObj.background_settings.posX == -1 && blockDataObj.background_settings.posY == -1) {
            blockDataObj.background_settings.posX = blockDataObj.width
            blockDataObj.background_settings.posY = blockDataObj.height

        }

        blockDataObj.background_settings.crop = blockJsonObj["background"]["crop"];
        blockDataObj.background_settings.rotate = blockJsonObj["background"]["rotate"];
        users[id]["blockList"].push(blockDataObj);
        let croppedHeight = Config.previewHeight;
        let croppedWidth = Config.previewWidth;

        if (!users[id].isPreview) {
            users[id].croppedHeight = Config.hdHeight
            users[id].croppedWidth = Config.hdWidth
            croppedHeight = users[id].croppedHeight
            croppedWidth = users[id].croppedWidth
        }
        let starting_cmd = ""
        let additional_cmd = ""
        let isFit = false
        if (blockDataObj.background_settings.crop == "Fittoframe") {
            isFit = true;
            let hColor = Utils.hexToRgb(blockDataObj.background_settings.color);
            let rgbHex = Utils.rgbToHex(hColor.r, hColor.g, hColor.b);
            starting_cmd = ["-f", "lavfi", "-i", "color=c=" + rgbHex + ":s=" + croppedWidth + "x" + croppedHeight]
            if (blockDataObj.background_settings.rotate == 0) {
                additional_cmd = "[0:v]scale='trunc(oh*a/2)*2':" + (croppedHeight * blockDataObj.background_settings.scale) + "[0ds];[1:v][0ds]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2[0sv];[0sv]crop=" + croppedWidth + ":" + croppedHeight + ":0:0[0v]"
            } else if (blockDataObj.background_settings.rotate == 180) {
                additional_cmd = "[0:v]scale='trunc(oh*a/2)*2':" + (croppedHeight * blockDataObj.background_settings.scale) + ",rotate=" + blockDataObj.background_settings.rotate + "*PI/180[0ds];[1:v][0ds]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2[0sv];[0sv]crop=" + croppedWidth + ":" + croppedHeight + ":0:0[osa]"
            } else if (blockDataObj.background_settings.rotate == 180 || blockDataObj.background_settings.rotate == 90 || blockDataObj.background_settings.rotate == 270) {
                additional_cmd = "[0:v]scale='trunc(oh*a/2)*2':" + (croppedHeight * blockDataObj.background_settings.scale) + ",rotate=" + blockDataObj.background_settings.rotate + "*PI/180[0ds];[1:v][0ds]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2[0sv];[0sv]crop=" + croppedWidth + ":" + croppedHeight + ":0:0[osa]"
            }
        }
        new Promise((resolve, reject) => {
            let outputFile = Config.output_directory + id + path.sep + "data" + path.sep + "p" + Utils.generateRandomID() + path.basename(blockDataObj.parsedMedia.pathname);
            let port = null;

            if (blockDataObj.background_settings.rotate == 0) {

                let worker_data = { id: id, index: i, file_name: path.basename(blockDataObj.parsedMedia.pathname), name: "ffmpeg", cmd: ["-y", "-i", blockDataObj.url, ...starting_cmd, "-filter_complex", isFit ? additional_cmd : "[0:v]scale='trunc(oh*a/2)*2':" + (croppedHeight * blockDataObj.background_settings.scale) + ",crop=" + croppedWidth + ":" + croppedHeight + ":" + blockDataObj.background_settings.posX + ":" + blockDataObj.background_settings.posY + "[0v]", "-map", "[0v]", "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "copy", "-movflags", "faststart", "-t", blockDataObj.timing, outputFile] };

                port = new Worker(('./workerChild.js'), {
                    workerData: worker_data
                })
            } else if (blockDataObj.background_settings.rotate == 180) {
                port = new Worker(('./workerChild.js'), {
                    workerData: { id: id, index: i, file_name: path.basename(blockDataObj.parsedMedia.pathname), name: "ffmpeg", cmd: ["-y", "-i", blockDataObj.url, ...starting_cmd, "-filter_complex", isFit ? additional_cmd : "[0:v]rotate=" + blockDataObj.background_settings.rotate + "*PI/180,scale=" + Math.floor((croppedWidth * blockDataObj.background_settings.scale / blockDataObj.height) * (croppedWidth * blockDataObj.background_settings.scale)) + "x" + Math.floor(((croppedWidth * blockDataObj.background_settings.scale) / blockDataObj.height) * blockDataObj.height) + ",crop=" + croppedWidth + ":" + croppedHeight + ":" + blockDataObj.background_settings.posX + ":" + blockDataObj.background_settings.posY + "[osa]", "-c:v", "libx264", "-preset", "ultrafast", "-map", "[osa]", "-c:a", "copy", "-movflags", "faststart", "-t", blockDataObj.timing, outputFile] }
                })
            } else if (blockDataObj.background_settings.rotate == 270) {
                port = new Worker(('./workerChild.js'), {
                    workerData: { id: id, index: i, file_name: path.basename(blockDataObj.parsedMedia.pathname), name: "ffmpeg", cmd: ["-y", "-i", blockDataObj.url, ...starting_cmd, "-filter_complex", isFit ? additional_cmd : "[0:v]rotate=" + blockDataObj.background_settings.rotate + "*PI/180,scale=" + Math.floor(((croppedWidth * blockDataObj.background_settings.scale) / blockDataObj.height) * (croppedWidth * blockDataObj.background_settings.scale)) + "x" + Math.floor(((croppedWidth * blockDataObj.background_settings.scale) / blockDataObj.height) * blockDataObj.height) + ",crop=" + croppedWidth + ":" + croppedHeight + ":" + blockDataObj.background_settings.posX + ":" + blockDataObj.background_settings.posY + "[osa]", "-c:v", "libx264", "-preset", "ultrafast", "-map", "[osa]", "-c:a", "copy", "-movflags", "faststart", "-t", blockDataObj.timing, outputFile] }
                })
            } else if (blockDataObj.background_settings.rotate == 90) {
                port = new Worker(('./workerChild.js'), {
                    workerData: { id: id, index: i, file_name: path.basename(blockDataObj.parsedMedia.pathname), name: "ffmpeg", cmd: ["-y", "-i", blockDataObj.url, ...starting_cmd, "-filter_complex", isFit ? additional_cmd : "[0:v]rotate=" + blockDataObj.background_settings.rotate + "*PI/180,scale=" + Math.floor(((croppedWidth * blockDataObj.background_settings.scale) / blockDataObj.height) * (croppedWidth * blockDataObj.background_settings.scale)) + "x" + parseInt(((croppedWidth * blockDataObj.background_settings.scale) / blockDataObj.height) * blockDataObj.height) + ",crop=" + croppedWidth + ":" + croppedHeight + ":" + blockDataObj.background_settings.posX + ":" + blockDataObj.background_settings.posY + "[osa]", "-c:v", "libx264", "-preset", "ultrafast", "-map", "[osa]", "-c:a", "copy", "-movflags", "faststart", "-t", blockDataObj.timing, outputFile] }
                });
            }

            blockDataObj.url = outputFile;
            port.on('message', (data) => {
                users[data.id].processedVideos++;
                users[data.id]["blockList"][data.index].url = outputFile;
            });
            port.on('error', reject);
            port.on('exit', (code) => {
            })
        })
    }

    processLogo = async function (blockDataObj, id, i) {
        let img = null;
        try {
            img = sizeOf(blockDataObj.logo['url']);
        }
        catch (e) {
            let obj = new Object();
            obj.socket = users[id].socket;
            if (!users[id].isPreview)
                obj.data = {
                    'status': 'error', videos_progress: { '360p': 0, '480p': 0, '720p': 0, '1080p': 0 }
                    , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': 'none' }
                }
            else
                obj.data = {
                    'status': 'error',
                    'is_preview': 'false'
                    , video_url: { url: 'none' }
                }
            users[id].eventEmitter.emit('onProgress', obj);
            return;
        }
        let additional_cmd = [];
        let extent_cmd = [];
        additional_cmd = ["-gravity", "center"]
        if (users[id].isPreview) {
            extent_cmd = ["-resize", "x151"];
        } else {
            extent_cmd = ["-resize", "x680"];
        }
        await new Promise((resolve, reject) => {
            port = new Worker(('./workerChild.js'), {
                workerData: { index: i, id: id, file_name: path.basename(blockDataObj.logo['parsedMedia'].pathname), name: "convert", cmd: ["convert", blockDataObj.logo["url"], ...additional_cmd, "-resize", (blockDataObj.logo["scale"] * 100) + "%", "-rotate", blockDataObj.logo["rotate"], ...extent_cmd, Config.output_directory + id + path.sep + "data" + path.sep + "plogo" + path.basename(blockDataObj.logo['parsedMedia'].pathname)] }
            })
            port.on('message', (data) => {
                users[id]["blockList"][data.index].logo["url"] = Config.output_directory + id + path.sep + "data" + path.sep + "plogo" + data.file_name
                let img = sizeOf(users[id]["blockList"][data.index].logo["url"])
                users[id]["blockList"][data.index].logo["width"] = img.width;
                users[id]["blockList"][data.index].logo["height"] = img.height;
                resolve();
            });
            port.on('error', reject);
            port.on('exit', (code) => {
            })
        })
    }
    //Processing image function to add width / height & resize if needed
    processImage = async function (blockDataObj, id, i, j, animation_style) {
        let img = null;
        let users = Config.users;
        let posX = 0;
        let posY = 0;
        try {
            img = sizeOf(blockDataObj.url);
        }
        catch (e) {
            console.log("ERROR", e);
            let obj = new Object();
            obj.socket = users[id].socket;
            if (!users[id].isPreview)
                obj.data = {
                    'status': 'error', videos_progress: { '360p': 0, '480p': 0, '720p': 0, '1080p': 0 }
                    , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': 'none' }
                }
            else
                obj.data = {
                    'status': 'error',
                    'is_preview': 'false'
                    , video_url: { url: 'none' }
                }
            users[id].eventEmitter.emit('onProgress', obj);
            return;
        }
        blockDataObj.width = img.width;
        blockDataObj.height = img.height;
        /*blockDataObj.background_settings.crop = blockData["background"]["crop"]
    
        blockDataObj.background_settings.rotate = blockData["background"]["rotate"]
       
       */
        if (blockDataObj.background_settings.posX >= 0) {
            posX = "-" + Math.abs(blockDataObj.background_settings.posX);
        } else {
            posX = "+" + Math.abs(blockDataObj.background_settings.posX);
        }
        if (blockDataObj.background_settings.posY >= 0) {
            posY = "+" + Math.abs(blockDataObj.background_settings.posY);
        } else {
            posY = "-" + Math.abs(blockDataObj.background_settings.posY);
        }
        let additional_cmd = [];
        let extent_cmd = [];
        if (blockDataObj.background_settings.crop == "Fittoframe") {
            let yHeight = 1500;
            if (animation_style == "bulletin" || animation_style == "blankslate") {
                yHeight = Config.hdHeight;
            }
            blockDataObj.width = Config.hdWidth;
            blockDataObj.height = Config.hdHeight;
            additional_cmd =
                ["-resize", "x" + Config.hdHeight, "-gravity", "center", "-extent", Config.hdWidth + "x" + Config.hdHeight + "+0+0"];
            extent_cmd = ["-background", blockDataObj.background_settings.color, "-extent", Config.hdWidth + "x1500+0+0"];
        } else if (blockDataObj.background_settings.crop == "left" || blockDataObj.background_settings.crop == "right") {
            blockDataObj.width = 960;
            blockDataObj.height = Config.hdHeight;
            extent_cmd = ["-resize", Config.hdWidth + "x" + Config.hdHeight + "^", "-extent", 960 + "x" + Config.hdHeight + posX + posY];
        } else {
            if (animation_style == "hiRise") {
                additional_cmd = ["-gravity", "center"];
            } else if (animation_style == "bulletin" || animation_style == "blankslate" || animation_style == "standout") {
                additional_cmd = ["-gravity", "center"];
            }
            extent_cmd = ["-resize", Config.hdWidth + "x" + Config.hdHeight + "^", "-extent", Config.hdWidth + "x" + Config.hdHeight + posX + posY];
            blockDataObj.width = Config.hdWidth;
            blockDataObj.height = Config.hdHeight;
        }
        if (users[id].blocksData[i].type != "photo burst") {
            users[id]["blockList"].push(blockDataObj);
        } else {
            users[id]["blockList"][i].bg[j] = (blockDataObj)
        }
        await new Promise((resolve, reject) => {
            let outputFile = Config.output_directory + id + path.sep + "data" + path.sep + "p" + Utils.generateRandomID() + path.basename(blockDataObj.parsedMedia.pathname);
            let port = null;
            port = new Worker(('./workerChild.js'), {
                workerData: { j: j, index: i, id: id, file_name: path.basename(blockDataObj.parsedMedia.pathname), name: "convert", cmd: ["convert", blockDataObj.url, ...additional_cmd, "-resize", (blockDataObj.background_settings.scale * 100) + "%", "-rotate", blockDataObj.background_settings.rotate, ...extent_cmd, outputFile] }
            })
            port.on('message', (data) => {
                if (users[id].blocksData[i].type != "photo burst") {
                    users[id]["blockList"][data.index].url = outputFile;
                    let img = sizeOf(users[id]["blockList"][data.index].url);
                    users[id]["blockList"][data.index].width = img.width;
                    users[id]["blockList"][data.index].height = img.height;
                    resolve();
                } else {
                    users[id]["blockList"][data.index].bg[data.j].url = outputFile;
                    let img = sizeOf(users[id]["blockList"][data.index].bg[data.j].url);
                    users[id]["blockList"][data.index].bg[data.j].width = img.width;
                    users[id]["blockList"][data.index].bg[data.j].height = img.height;
                    resolve();
                }
            });
            port.on('error', reject);
            port.on('exit', (code) => {
            });
        });
    }

    //Process video for merging frames
    processResolution = function (id, hHeight, wWidth, bWidth, bHeight) {
        let users = Config.users;
        let height_bool = false
        let width_bool = false

        let xAxis = 0, yAxis = 0, totalWidth = 0, totalHeight = 0
        if (bHeight > wWidth) { height_bool = true }

        if (bWidth > hHeight) { width_bool = true }
        if (height_bool && !width_bool) {
            currXOffset = 0

            yAxis = wWidth / bHeight
            xAxis = hHeight / bWidth
        } else if (!height_bool && width_bool) {
            currXOffset = (bWidth - hHeight) / 2

            yAxis = wWidth / bHeight
            xAxis = hHeight / bWidth
        } else if (height_bool && width_bool) {
            currXOffset = (bWidth - hHeight) / 2

            yAxis = wWidth / bHeight
            xAxis = hHeight / bWidth
        }
        else {
            yAxis = wWidth / bHeight
            xAxis = hHeight / bWidth
        }
        totalWidth = xAxis * bWidth
        totalHeight = yAxis * bHeight
        let percent = 0
        if (totalWidth == users[id].iWidth && totalHeight == users[id].iHeight) {

            percent = 100 * xAxis
        }
        else if (totalWidth >= users[id].iWidth && totalHeight < users[id].iHeight) {
            let incrementCurrent = wWidth / bHeight
            totalHeight *= incrementCurrent
            totalWidth *= incrementCurrent
            percent = incrementCurrent * 100;
        } else if (totalWidth < users[id].iWidth && totalHeight >= users[id].iHeight) {
            let incrementCurrent = wWidth / bHeight
            totalHeight *= incrementCurrent
            totalWidth *= incrementCurrent
            percent = incrementCurrent * 100;
        } else {

            let incrementCurrent = wWidth / bHeight;
            totalHeight *= incrementCurrent;
            totalWidth *= incrementCurrent;
            percent = incrementCurrent * 100;
        }
        return percent
    }
    //Download functions
    download = async function (id, urlString, path) {
        let url_host = new URL(urlString).hostname
        if (url_host == "localhost") {
            this.sendError(id);
        }
        await Utils.makeSynchronousRequest(urlString, path);

        if (!fs.existsSync(path)) {

            this.sendError(id);

        }
    }
    //Send error while progress
    sendError = function (id) {


        let obj = new Object()
        obj.socket = users[id].socket
        if (!users[id].isPreview)
            obj.data = {
                'status': 'error', videos_progress: { '360p': users[id].p_360, '480p': users[id].p_480, '720p': users[id].p_720, '1080p': users[id].p_1080 }
                , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': 'none' }
            }
        else
            obj.data = {
                'status': 'error',
                'is_preview': 'false'
                , video_url: { url: 'none' }
            }
        users[id].eventEmitter.emit('onProgress', obj);

    }
    //Get Media function for parsing and calling download function
    getMedias = async function (json, id, animation_style) {
        let users = Config.users;
        users[id].blocksData = json["blocks"]

        if (users[id].blocksData.length <= 0) {
            this.sendError(id)


        }
        for (let i = 0; i < users[id].blocksData.length; i++) {
            let blockDataObj = new Object();
            let parsed = null;
            blockDataObj.type = users[id].blocksData[i]["type"];
            blockDataObj.linesListXAxis = [];
            blockDataObj.linesListYAxis = [];
            blockDataObj.linesListXAxisSub = [];
            blockDataObj.linesListYAxisSub = [];

            if (blockDataObj.type != "text") {

                if (blockDataObj.type != "photo burst" && users[id].blocksData[i].background['media'].length > 0) {
                    parsed = new Url(users[id].blocksData[i].background['media']);
                    blockDataObj.parsedMedia = parsed;
                    blockDataObj.url = Config.output_directory + id + path.sep + "data" + path.sep + path.basename(parsed.pathname);
                    if (blockDataObj.type == "quote") {

                        if (Config.extImages.includes(path.extname(parsed.pathname))) {
                            blockDataObj.type = "quoteImage"
                        } else if (Config.extVideos.includes(path.extname(parsed.pathname))) {
                            blockDataObj.type = "quoteVideo"
                        }
                    } else if (blockDataObj.type == "logo") {

                        if (Config.extImages.includes(path.extname(parsed.pathname))) {

                            blockDataObj.type = "logoImage"
                        } else if (Config.extVideos.includes(path.extname(parsed.pathname))) {

                            blockDataObj.type = "logoVideo"
                        } else {

                            blockDataObj.type = "logoText"

                        }
                    }

                    await this.download(id, users[id].blocksData[i].background['media'], Config.output_directory + id + path.sep + "data" + path.sep + path.basename(parsed.pathname))
                } else if (blockDataObj.type == "photo burst") {

                    if (users[id].blocksData[i].background.length > 0) {
                        blockDataObj.bg = []
                        blockDataObj.speed = users[id].blocksData[i].backgroundOptions['speed']
                        for (let j = 0; j < users[id].blocksData[i].background.length; j++) {

                            parsed = new Url(users[id].blocksData[i].background[j]['media']);
                            let bm = new Object()
                            bm.parsedMedia = parsed;
                            bm.url = Config.output_directory + id + path.sep + "data" + path.sep + path.basename(parsed.pathname);
                            blockDataObj.bg.push(bm);
                            await this.download(id, users[id].blocksData[i].background[j]['media'], Config.output_directory + id + path.sep + "data" + path.sep + path.basename(parsed.pathname))
                        }
                        blockDataObj.background_settings = new Object();
                        blockDataObj.background_settings.cropped = "FullScreen"
                        users[id]["blockList"].push(blockDataObj)
                    }

                } else if (blockDataObj.type == "logo") {
                    blockDataObj.type = "logoText"



                }
            }


            if (blockDataObj.type == "logoImage" || blockDataObj.type == "logoVideo" || blockDataObj.type == "logoText") {
                if (users[id].blocksData[i].logo['source'].length > 0) {
                    parsed = new Url(users[id].blocksData[i].logo['source']);
                    blockDataObj.logoParsedMedia = parsed;
                    blockDataObj.logoURL = Config.output_directory + id + path.sep + "data" + path.sep + path.basename(parsed.pathname);

                    await this.download(id, users[id].blocksData[i].logo['source'], Config.output_directory + id + path.sep + "data" + path.sep + path.basename(parsed.pathname))
                }
                blockDataObj.logo = [];

                blockDataObj.logo['animation_settings'] = users[id].blocksData[i].logo["animation"]

                blockDataObj.logo['scale'] = users[id].blocksData[i].logo["scale"]

                blockDataObj.logo['rotate'] = users[id].blocksData[i].logo["rotate"]
                blockDataObj.logo['url'] = blockDataObj.logoURL
                blockDataObj.logo['parsedMedia'] = blockDataObj.logoParsedMedia

            }

            blockDataObj.timing = users[id].blocksData[i]["timing"]

            blockDataObj.alignH = users[id].blocksData[i]["text"]["align"].horizontal
            blockDataObj.alignV = users[id].blocksData[i]["text"]["align"].vertical
            if (blockDataObj.type == "logoImage" || blockDataObj.type == "logoVideo" || blockDataObj.type == "logoText") {


                blockDataObj.alignV = "bottom";

                blockDataObj.alignH = "center";
            }
            blockDataObj.voice_over = new Object()
            blockDataObj.voice_over.exist = users[id].blocksData[i]["voiceover"]["present"]
            blockDataObj.voice_over.source = users[id].blocksData[i]["voiceover"]["source"]
            blockDataObj.voice_over.volume = users[id].blocksData[i]["voiceover"]["volume"]
            if (blockDataObj.type == "photo burst") {
                for (let j = 0; j < users[id].blocksData[i].background.length; j++) {

                    blockDataObj.bg[j].background_settings = new Object();

                    blockDataObj.bg[j].background_settings.color =
                        users[id].blocksData[i]["background"][j]["color"]

                    blockDataObj.bg[j].background_settings.scale =
                        users[id].blocksData[i]["background"][j]["scale"]
                    if (users[id].blocksData[i]["background"][j].hasOwnProperty("dimensions")) {

                        blockDataObj.bg[j].background_settings.width =
                            users[id].blocksData[i]["background"][j]["dimensions"]["width"]

                        blockDataObj.bg[j].background_settings.height =
                            users[id].blocksData[i]["background"][j]["dimensions"]["height"]
                    } else {
                        blockDataObj.bg[j].background_settings.width = -1;

                        blockDataObj.bg[j].background_settings.height = -1;

                    }


                    if (blockDataObj.bg[j].background_settings.width == -1) {

                        blockDataObj.bg[j].background_settings.posX = -1
                        blockDataObj.bg[j].background_settings.posY = -1

                    } else {
                        if (users[id].blocksData[i]["background"][j]["position"]["x"] == 0 && users[id].blocksData[i]["background"][j]["position"]["y"] == 0) {

                            blockDataObj.bg[j].background_settings.width = 0

                            blockDataObj.bg[j].background_settings.height = 0

                            blockDataObj.bg[j].background_settings.posX = -1
                            blockDataObj.bg[j].background_settings.posY = -1

                        } else {
                            blockDataObj.bg[j].background_settings.posX =
                                (users[id].blocksData[i]["background"][j]["position"]["x"] / blockDataObj.bg[j].background_settings.width) * this.mainWidth

                            blockDataObj.bg[j].background_settings.posY =
                                (users[id].blocksData[i]["background"][j]["position"]["y"] / blockDataObj.bg[j].background_settings.height) * this.mainHeight
                        }
                    }
                }
            } else {
                blockDataObj.background_settings = new Object();
                blockDataObj.background_settings.color =
                    users[id].blocksData[i]["background"]["color"]

                blockDataObj.background_settings.scale =
                    users[id].blocksData[i]["background"]["scale"];
                if (users[id].blocksData[i]["background"].hasOwnProperty("dimensions")) {

                    blockDataObj.background_settings.width =
                        users[id].blocksData[i]["background"]["dimensions"]["width"]

                    blockDataObj.background_settings.height =
                        users[id].blocksData[i]["background"]["dimensions"]["height"]
                } else {
                    blockDataObj.background_settings.width = -1;

                    blockDataObj.background_settings.height = -1;

                }
                if (blockDataObj.background_settings.width == -1) {

                    blockDataObj.background_settings.posX = -1
                    blockDataObj.background_settings.posY = -1

                } else {
                    if (users[id].blocksData[i]["background"]["position"]["x"] == 0 && users[id].blocksData[i]["background"]["position"]["y"] == 0) {

                        blockDataObj.background_settings.width = 0

                        blockDataObj.background_settings.height = 0

                        blockDataObj.background_settings.posX = -1
                        blockDataObj.background_settings.posY = -1

                    } else {
                        blockDataObj.background_settings.posX =
                            (users[id].blocksData[i]["background"]["position"]["x"] / blockDataObj.background_settings.width) * this.mainWidth

                        blockDataObj.background_settings.posY =
                            (users[id].blocksData[i]["background"]["position"]["y"] / blockDataObj.background_settings.height) * this.mainHeight
                    }
                }
            }
            if (blockDataObj.voice_over.exist) {

                let parsed = new Url(blockDataObj.voice_over.source);
                blockDataObj.voice_over.local_source = Config.output_directory + id + path.sep + "data" + path.sep + path.basename(parsed.pathname);

                await this.download(id, blockDataObj.voice_over.source, blockDataObj.voice_over.local_source)

            }

            if (blockDataObj.type == "photo burst") {
                for (let j = 0; j < users[id].blocksData[i].background.length; j++) {

                    blockDataObj.bg[j].background_settings.crop = users[id].blocksData[i]["background"][j]["crop"]
                    blockDataObj.bg[j].background_settings.rotate = users[id].blocksData[i]["background"][j]["rotate"]

                    await this.processImage(blockDataObj.bg[j], id, i, j, animation_style);

                }

            } else {

                blockDataObj.background_settings.crop = users[id].blocksData[i]["background"]["crop"]
            }

            if (blockDataObj.type == "text" || blockDataObj.type == "logoText") {

                blockDataObj.background_settings.rotate = users[id].blocksData[i]["background"]["rotate"]

                users[id]["blockList"].push(blockDataObj);

            } else
                if (blockDataObj.type == "photo" || blockDataObj.type == "quoteImage" || blockDataObj.type == "logoImage") {

                    blockDataObj.background_settings.rotate = users[id].blocksData[i]["background"]["rotate"]

                    await this.processImage(blockDataObj, id, i, -1, animation_style);

                } else if (blockDataObj.type == "video" || blockDataObj.type == "quoteVideo" || blockDataObj.type == "logoVideo") {

                    await this.processVideo(users[id].blocksData[i], blockDataObj, id, i)
                } if (blockDataObj.type == "logoText" || blockDataObj.type == "logoImage" || blockDataObj.type == "logoVideo") {

                    await this.processLogo(blockDataObj, id, i);
                }
        }

    }
    getHeightCharacter = function (animation_style, i, linestList, type) {
        let axis = 0
        if (animation_style == "hiRise" || animation_style == "blankslate" || animation_style == "standout") {
            for (let m = 0; m < i - 1; m++) {
                if (m == 0) {
                    if (animation_style == "blankslate" || animation_style == "standout") {
                        axis += 90 + linestList[m]["ascentLine"];
                    } else {
                        axis += 70 + linestList[m]["ascentLine"];
                    }
                } else {
                    axis += (linestList[m]["ascentLine"] + Math.abs(linestList[m]["descentLine"]) + 5);
                }

            }
        } else if (animation_style == "bulletin") {
            if (i == 1) {
                axis += 90 + (Math.abs(linestList[0]["ascentLine"]));
            }
            for (let m = 0; m < i - 1; m++) {
                if (type == "Main") {
                    if (m == 0) {
                        axis += 270 + (Math.abs(linestList[0]["descentLine"]) + 5)
                    } else {
                        axis += (linestList[m]["ascentLine"])
                    }

                } else {
                    axis += (linestList[m]["heightLine"]) + 30

                }

            }

        }
        return axis;
    }

    doProcessText = async function (id, blockIndex, animation_style) {
        let users = Config.users;
        let offY = 0;
        let offX = 0;
        let offYFirst = 0;
        if (animation_style == "bulletin") {
            offY = 60;
            offX = 100;
            offYFirst = 60;
        } else if (animation_style == "hiRise") {
            offY = 200;
            offX = 195;
            offYFirst = 100;
        } else if (animation_style == "blankslate") {
            offY = 100;
            offX = 105;
            offYFirst = 60;
        } else if (animation_style == "standout") {
            offY = 100;
            offX = 105;
            offYFirst = 60;
        }

        users[id].maxFirstCrop = (offX / Config.hdWidth) * this.mainWidth;
        if (users[id]["blockList"][blockIndex].type != "photo burst" && (users[id]["blockList"][blockIndex].background_settings.crop == "left" || users[id]["blockList"][blockIndex].background_settings.crop == "right")) {
            users[id].iWidth = 960;
            users[id].maxHeightBound = users[id].maxHeightBound;
            users[id].offsetY = (offY / Config.hdHeight) * users[id].iHeight;
            users[id].maxHeightBound = ((Config.hdHeight - offYFirst) / Config.hdHeight) * users[id].iHeight;
            users[id].maxHeightStart = ((offYFirst) / Config.hdHeight) * users[id].iHeight;
            users[id].maxFirstCrop = (offX / Config.hdWidth) * users[id].iWidth;
            users[id].maxWidthBound = ((Config.hdWidth - offX) / Config.hdWidth) * users[id].iWidth;
            users[id].maxWidthBoundCrop = ((Config.hdWidth - offX) / Config.hdWidth) * users[id].iWidth;
            users[id].iWidth = Config.hdWidth;
        } else if (users[id].isPreview) {
            users[id].iWidth = Config.hdWidth;
            users[id].offsetY = (offY / Config.hdHeight) * users[id].iHeight;
            users[id].maxHeightBound = ((Config.hdHeight - offYFirst) / Config.hdHeight) * users[id].iHeight;
            users[id].maxHeightStart = ((offYFirst) / Config.hdHeight) * users[id].iHeight;
            users[id].maxWidthBound = ((Config.hdWidth - offX) / Config.hdWidth) * users[id].iWidth;
            users[id].maxFirstCrop = (offX / Config.hdWidth) * users[id].iWidth;
            users[id].maxWidthBoundCrop = ((Config.hdWidth - offX) / Config.hdWidth) * users[id].iWidth;
        } else {
            users[id].iWidth = Config.hdWidth;
            users[id].offsetY = (offY / Config.hdHeight) * users[id].iHeight;
            users[id].maxHeightBound = ((Config.hdHeight - offYFirst) / Config.hdHeight) * users[id].iHeight;
            users[id].maxHeightStart = ((offYFirst) / Config.hdHeight) * users[id].iHeight;
            users[id].maxWidthBound = ((Config.hdWidth - offX) / Config.hdWidth) * users[id].iWidth;
            users[id].maxWidthBoundCrop = ((Config.hdWidth - offX) / Config.hdWidth) * users[id].iWidth;
            users[id].maxFirstCrop = (offX / Config.hdWidth) * users[id].iWidth;
        }
        users[id]["blockList"][blockIndex].linesListMain = [];
        users[id]["blockList"][blockIndex].linesListSub = [];

        users[id]["blockList"][blockIndex].linesWidthMain = [];
        users[id]["blockList"][blockIndex].linesWidthSub = [];
        let maxWidthLocal = users[id].maxWidthBound
        if (users[id]["blockList"][blockIndex].alignH == "center" && type == "Sub") {

            maxWidthLocal = users[id].maxWidthBound - ((users[id].maxWidthBound / 2) - (
                users[id]["blockList"][blockIndex].linesWidthMain[0] / 2)) - (60);


        }
        maxWidthLocal -= users[id].maxFirstCrop;
        let wordsListMain = this.mainTextClass.generateText(users[id]["blockList"][blockIndex].text[0]["text"].trim(), maxWidthLocal, users[id]["blockList"][blockIndex].text[0]["fontSize"])
        let wordsListSub = this.subTextClass.generateText(users[id]["blockList"][blockIndex].text[1]["text"].trim(), maxWidthLocal, users[id]["blockList"][blockIndex].text[1]["fontSize"])

        for (let i = 0; i < wordsListMain.length; i++) {
            let tempObject = {};
            tempObject["widthLine"] = wordsListMain[i].width;

            tempObject["nDescentLine"] = wordsListMain[i].ascent;
            if (i > 0)
                tempObject["nDescentLine"] += wordsListMain[i - 1].descent;
            tempObject["heightLine"] = wordsListMain[i].ascent + wordsListMain[i].descent;
            tempObject["ascentLine"] = wordsListMain[i].ascent;
            tempObject["textLine"] = wordsListMain[i].text;
            tempObject["descentLine"] = wordsListMain[i].descent;
            users[id]["blockList"][blockIndex].linesListMain.push(tempObject);

            users[id]["blockList"][blockIndex].linesWidthMain.push(tempObject["widthLine"]);

        }
        for (let i = 0; i < wordsListSub.length; i++) {

            let tempObject = {};
            tempObject["widthLine"] = wordsListSub[i].width;
            tempObject["heightLine"] = wordsListSub[i].ascent + wordsListSub[i].descent;
            tempObject["ascentLine"] = wordsListSub[i].ascent;
            tempObject["descentLine"] = wordsListSub[i].descent;

            tempObject["nDescentLine"] = wordsListSub[i].ascent;

            if (i > 0)
                tempObject["nDescentLine"] += wordsListSub[i - 1].descent;
            tempObject["textLine"] = wordsListSub[i].text;
            users[id]["blockList"][blockIndex].linesListSub.push(tempObject);

            users[id]["blockList"][blockIndex].linesWidthSub.push(tempObject["widthLine"]);
        }

        let totalMainHeight = this.getHeightCharacter(animation_style, users[id]["blockList"][blockIndex].linesListMain.length, users[id]["blockList"][blockIndex].linesListMain, "Main");
        let totalSubHeight = this.getHeightCharacter(animation_style, users[id]["blockList"][blockIndex].linesListSub.length, users[id]["blockList"][blockIndex].linesListSub, "Sub");
        let percentMain = totalMainHeight / (users[id].maxHeightBound - users[id].maxHeightStart);
        let percentSub = totalSubHeight / (users[id].maxHeightBound - users[id].maxHeightStart);
        if (percentMain > 1) {
            for (let i = 1; i <= users[id]["blockList"][blockIndex].linesListMain.length; i++) {
                if (this.getHeightCharacter(animation_style, i, users[id]["blockList"][blockIndex].linesListMain, "Main") > users[id].maxHeightBound - users[id].maxHeightStart) {
                    percentMain = 1;
                    users[id]["blockList"][blockIndex].linesWidthMain.splice(i - 1);
                    users[id]["blockList"][blockIndex].linesListMain.splice(i - 1);
                    break;
                }
            }
        }
        if (percentSub > 1) {
            for (let i = 1; i <= users[id]["blockList"][blockIndex].linesListSub.length; i++) {
                if (this.getHeightCharacter(animation_style, i, users[id]["blockList"][blockIndex].linesListSub, "Main") >
                    users[id].maxHeightBound - users[id].maxHeightStart) {
                    percentSub = 1;
                    users[id]["blockList"][blockIndex].linesWidthSub.splice(i - 1);
                    users[id]["blockList"][blockIndex].linesListSub.splice(i - 1);
                    break;
                }
            }
        }
        if (percentSub >= 0.5 && percentMain >= 0.5) {
            for (let i = 1; i <= users[id]["blockList"][blockIndex].linesListMain.length; i++) {
                if (this.getHeightCharacter(animation_style, i, users[id]["blockList"][blockIndex].linesListMain, "Main") > (users[id].maxHeightBound - users[id].maxHeightStart) / 2) {
                    percentSub = 1;
                    users[id]["blockList"][blockIndex].linesListMain.splice(i - 1);
                    users[id]["blockList"][blockIndex].linesWidthMain.splice(i - 1);
                    break;
                }
            }
            for (let i = 1; i <= users[id]["blockList"][blockIndex].linesListSub.length; i++) {
                if (this.getHeightCharacter(animation_style, i, users[id]["blockList"][blockIndex].linesListSub, "Sub") > (users[id].maxHeightBound - users[id].maxHeightStart) / 2) {
                    percentSub = 1;
                    users[id]["blockList"][blockIndex].linesListSub.splice(i - 1);
                    users[id]["blockList"][blockIndex].linesWidthSub.splice(i - 1);
                    break;
                }
            }
        } else
            if (percentSub < percentMain) {
                let tempMainPecent = percentMain - percentSub;
                if (percentMain + percentSub > 1) {
                    for (let i = 1; i <= users[id]["blockList"][blockIndex].linesListMain.length; i++) {
                        if (this.getHeightCharacter(animation_style, i, users[id]["blockList"][blockIndex].linesListMain, "Main") >
                            (users[id].maxHeightBound - users[id].maxHeightStart) * tempMainPecent) {
                            percentMain = 1;
                            users[id]["blockList"][blockIndex].linesListMain.splice(i - 1);
                            users[id]["blockList"][blockIndex].linesWidthMain.splice(i - 1);
                            break;
                        }
                    }
                }
            } else if (percentMain < percentSub) {
                let tempSubPecent = percentSub - percentMain;
                if (percentMain + percentSub > 1) {
                    for (let i = 1; i <= users[id]["blockList"][blockIndex].linesListSub.length; i++) {
                        if (this.getHeightCharacter(animation_style, i, users[id]["blockList"][blockIndex].linesListSub, "Sub") > (users[id].maxHeightBound - users[id].maxHeightStart) * tempSubPecent) {
                            percentSub = 1;
                            users[id]["blockList"][blockIndex].linesWidthSub.splice(i - 1);
                            users[id]["blockList"][blockIndex].linesListSub.splice(i - 1);
                            break;
                        }
                    }
                }
            } else if (percentMain == 1 && percentSub == 1) {
                for (let i = 1; i <= users[id]["blockList"][blockIndex].linesListMain.length; i++) {
                    if (this.getHeightCharacter(animation_style, i, users[id]["blockList"][blockIndex].linesListMain, "Main") > (users[id].maxHeightBound - users[id].maxHeightStart) / 2) {
                        percentSub = 1;
                        users[id]["blockList"][blockIndex].linesListMain.splice(i - 1);
                        users[id]["blockList"][blockIndex].linesWidthMain.splice(i - 1);
                        break;
                    }
                }
                for (let i = 1; i <= users[id]["blockList"][blockIndex].linesListSub.length; i++) {
                    if (this.getHeightCharacter(animation_style, i, users[id]["blockList"][blockIndex].linesListSub, "Sub") > (users[id].maxHeightBound - users[id].maxHeightStart) / 2) {
                        percentSub = 1;
                        users[id]["blockList"][blockIndex].linesListSub.splice(i - 1);
                        users[id]["blockList"][blockIndex].linesWidthSub.splice(i - 1);
                        break;
                    }
                }
            }
    }


    ffmpeg_run = function (user, command, folder, id) {
        let p_360_progress = 0
        let p_480_progress = 0
        let p_720_progress = 0
        let p_1080_progress = 100
        let resolution = ["640x360", "854x480", "1280x720"]
        let video_url = ["none", "none", "none", "http://" + Config.socket_ip + "/" + id + "/" + "1080p.mp4"]
        let output_path = ["360p.mp4", "480p.mp4", "720p.mp4", "1080p.mp4"]
        let total_videos_completed = 0;
        for (let i = 0; i < 3; i++) {

            const args = ["-y", "-i", command, "-vf", "scale=" + resolution[i], "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "copy", folder + output_path[i]]

            const { FFMpeg_Wrapper } = require('./ffmpeg_wrapper.js');

            const ffmpegProgress = new FFMpeg_Wrapper(0, i);
            const ffmpeg = require('child_process').spawn("ffmpeg", args);

            ffmpeg.stderr.pipe(ffmpegProgress).on('data', (data) => {

                if (data.index == 0) {
                    let c_progress = (data.time_ms / user.total_ms)
                    p_360_progress = parseInt(c_progress * 100)

                } else if (data.index == 1) {
                    let c_progress = (data.time_ms / user.total_ms)
                    p_480_progress = parseInt(c_progress * 100)


                } else if (data.index == 2) {

                    let c_progress = (data.time_ms / user.total_ms)
                    p_720_progress = parseInt(c_progress * 100)

                }
                let obj = new Object()
                obj.socket = user.socket
                obj.data = {
                    'status': 'inprogress',
                    videos_progress: { '360p': p_360_progress, '480p': p_480_progress, '720p': p_720_progress, '1080p': p_1080_progress }
                    , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': video_url[3] }
                }
                user.eventEmitter.emit('onProgress', obj);
            });
            let users = Config.users;
            let localStartTime = this.startTime;
            function exitHandler(options, code) {
                let ie = options.ie;
                let ide = options.ide
                if (code) {
                    console.error(`FFMPEG ERROR: ${ffmpegProgress.exitMessage}`);

                    users[ide].eventEmitter.removeAllListeners(); users.splice(ide, 1)
                } else {
                    users[ide].total_videos_completed++
                    video_url[ie] = "http://" + Config.socket_ip + "/" + ide + "/" + output_path[ie]


                    let obj = new Object()
                    obj.socket = users[ide].socket
                    obj.data = {
                        'status': 'inprogress',
                        videos_progress: { '360p': 100, '480p': 100, '720p': 100, '1080p': 100 }
                        , videos_url: { '360p': video_url[0], '480p': video_url[1], '720p': video_url[2], '1080p': video_url[3] }
                    }
                    users[ide].eventEmitter.emit('onProgress', obj);

                    if (users[ide].total_videos_completed == 3) {
                        let endTime = new Date() - localStartTime;
                        fs.appendFile(Config.output_directory + path.sep + "time.txt", id + "--" + endTime.toString(), function (err) {
                            if (err) throw err;
                            console.log('Saved!');
                        });
                        let obj = new Object()
                        obj.socket = users[ide].socket
                        obj.data = {
                            'status': 'completed',
                            videos_progress: { '360p': 100, '480p': 100, '720p': 100, '1080p': 100 }
                            , videos_url: { '360p': video_url[0], '480p': video_url[1], '720p': video_url[2], '1080p': video_url[3] }
                        }
                        users[ide].eventEmitter.emit('onProgress', obj);
                        users.splice(ide, 1)
                    }
                }
            }

            ffmpeg.on('close', exitHandler.bind(null, { ide: id, ie: i }))


        }


    }

    generateLogo = async function (user, id, blockIndex) {
        let cmdText = [];
        let totalCount = 25;
        let iWid = Config.previewWidth;
        let iHei = Config.previewHeight;
        let lclincrement = 0;
        if (!user.isPreview) {
            iWid = Config.hdWidth;
            iHei = Config.hdHeight;

        }

        for (let i = 0; i <= totalCount; i++) {
            lclincrement = i
            let n = parseFloat(i / totalCount)
            let val = parseFloat(i / totalCount)
            if (user["blockList"][blockIndex].logo['animation_settings'] == "fadeIn") {
                cmdText = ["-define", "png:color-type=6", "xc:transparent", user["blockList"][blockIndex].logo['url'], "-quality", "50", "-gravity", "center", "-alpha", "on", "-channel", "A", "-evaluate", "set", (val * 100) + "%", "+channel", "-fill", "transparent", "-background", "transparent", "-gravity", "center", "-extent", user["blockList"][blockIndex].logo['width'] * 1.03 + "x" + user["blockList"][blockIndex].logo['height'] * 1.03, "-composite", "PNG32:" + Config.output_directory + id + path.sep + "data" + path.sep + "frames" + (blockIndex + 1) + path.sep + "logo-" + lclincrement.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + ".png"];
            } else if (user["blockList"][blockIndex].logo['animation_settings'] == "slideDown") {
                val = Math.sin(n * Math.PI / 2);

                let xWidth = ((user["blockList"][blockIndex].logo['width'] * 1.03) / 2);
                let yHeight = ((user["blockList"][blockIndex].logo['height'] * 1.03) / 2);


                let xNew = (iWid / 2)
                let yNew = val * (iHei / 2)
                let finalR = 0
                cmdText = ["-define", "png:color-type=6", "xc:transparent", "-size", iWid + "x" + iHei, user["blockList"][blockIndex].logo['url'], "-virtual-pixel", "transparent", "-quality", "50", "-gravity", "center", "-alpha", "on", "-channel", "A", "-evaluate", "set", (val * 100) + "%", "+channel", "-fill", "transparent", "-background", "transparent", "-gravity", "center", "-define", "distort:viewport=" + iWid + "x" + iHei, "-distort", "SRT", (xWidth) + "," + (yHeight) + " " + 1 + " " + (finalR) + " " + xNew + "," + yNew, "-extent", iWid + "x" + iHei, "-composite", "PNG32:" + Config.output_directory + id + path.sep + "data" + path.sep + "frames" + (blockIndex + 1) + path.sep + "logo-" + lclincrement.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + ".png"];

            } else if (user["blockList"][blockIndex].logo['animation_settings'] == "zoomIn") {
                val = Math.sin(n * Math.PI / 2);

                cmdText = ["-define", "png:color-type=6", "xc:transparent", user["blockList"][blockIndex].logo['url'], "-quality", "50", "-gravity", "center", "-fill", "transparent", "-background", "transparent", "-virtual-pixel", "transparent", "-alpha", "set", "-channel", "A", "-evaluate", "set", (val * 100) + "%", "+channel", "-gravity", "center", "-define", "distort:viewport=" + user["blockList"][blockIndex].logo['width'] * 1.03 + "x" + user["blockList"][blockIndex].logo['height'] * 1.03, "-distort", "SRT", (0.03 + (val * 1)) + " 0", "-fill", "transparent", "-background", "transparent", "-gravity", "center", "-extent", user["blockList"][blockIndex].logo['width'] * 1.03 + "x" + user["blockList"][blockIndex].logo['height'] * 1.03, "-composite", "PNG32:" + Config.output_directory + id + path.sep + "data" + path.sep + "frames" + (blockIndex + 1) + path.sep + "logo-" + lclincrement.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + ".png"];


            } else if (user["blockList"][blockIndex].logo['animation_settings'] == "focus") {
                val = Math.sin(n * Math.PI / 2);

                if (i > totalCount - 10) {
                    cmdText = ["-define", "png:color-type=6", "xc:transparent", user["blockList"][blockIndex].logo['url'], "-quality", "50", "-fill", "transparent", "-background", "transparent", "-gravity", "center", "-resize", "130%", "-scale", 10 + (90 * val) + "%", "-blur", "0x" + (2.5 - (val * 2.5)), "-resize", ((100) + (100 - (100 * val))) + "%", "-virtual-pixel", "transparent", "-gravity", "center", "-define", "distort:viewport=" + user["blockList"][blockIndex].logo['width'] * 1.3 + "x" + user["blockList"][blockIndex].logo['height'] * 1.3, "-gravity", "center", "-distort", "SRT", (.7 + (.3 - (val * .3))) + " 0", "-gravity", "center", "-extent", user["blockList"][blockIndex].logo['width'] * 1.3 + "x" + user["blockList"][blockIndex].logo['height'] * 1.3, "-composite", "PNG32:" + Config.output_directory + id + path.sep + "data" + path.sep + "frames" + (blockIndex + 1) + path.sep + "logo-" + lclincrement.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + ".png"];

                } else {
                    cmdText = ["-define", "png:color-type=6", "xc:transparent", user["blockList"][blockIndex].logo['url'], "-quality", "50", "-fill", "transparent", "-background", "transparent", "-gravity", "center", "-resize", "130%", "-scale", (10) + "%", "-blur", "0x" + (2.5 - (val * 2.5)), "-resize", (1000) + "%", "-virtual-pixel", "transparent", "-gravity", "center", "-define", "distort:viewport=" + user["blockList"][blockIndex].logo['width'] * 1.3 + "x" + user["blockList"][blockIndex].logo['height'] * 1.3, "-gravity", "center", "-distort", "SRT", (.7 + (.3 - (val * .3))) + " 0", "-gravity", "center", "-extent", user["blockList"][blockIndex].logo['width'] * 1.3 + "x" + user["blockList"][blockIndex].logo['height'] * 1.3, "-composite", "PNG32:" + Config.output_directory + id + path.sep + "data" + path.sep + "frames" + (blockIndex + 1) + path.sep + "logo-" + lclincrement.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + ".png"];
                }

            } else if (user["blockList"][blockIndex].logo['animation_settings'] == "rotate") {

                let finalR = 270 + (360 - 270) * val;
                let xWidth = ((user["blockList"][blockIndex].logo['width'] * 1.03) / 2)
                let yHeight = ((user["blockList"][blockIndex].logo['height'] * 1.03) / 2)


                let xNew = (iWid / 2)
                let yNew = iHei / 2


                cmdText = ["-define", "png:color-type=6", "xc:transparent", "-size", iWid + "x" + iHei, user["blockList"][blockIndex].logo['url'], "-quality", "50", "-gravity", "center", "-fill", "transparent", "-background", "transparent", "-virtual-pixel", "transparent", "-alpha", "set", "-channel", "A", "-evaluate", "set", (val * 100) + "%", "+channel", "-gravity", "center", "-define", "distort:viewport=" + iWid + "x" + iHei, "-distort", "SRT", (xWidth) + "," + (yHeight) + " " + (0.01 + (val * 1.02)) + " " + (finalR) + " " + xNew + "," + yNew, "-fill", "transparent", "-background", "transparent", "-gravity", "center", "-extent", iWid + "x" + iHei, "-composite", "PNG32:" + Config.output_directory + id + path.sep + "data" + path.sep + "frames" + (blockIndex + 1) + path.sep + "logo-" + lclincrement.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + ".png"];


            } else if (user["blockList"][blockIndex].logo['animation_settings'] == "zoomOut") {
                val = Math.sin(n * Math.PI / 2);
                cmdText = ["-define", "png:color-type=6", "xc:transparent", user["blockList"][blockIndex].logo['url'], "-quality", "50", "-resize", "130%", "-gravity", "center", "-fill", "transparent", "-background", "transparent", "-virtual-pixel", "transparent", "-alpha", "set", "-channel", "A", "-evaluate", "set", (val * 100) + "%", "+channel", "-gravity", "center", "-define", "distort:viewport=" + user["blockList"][blockIndex].logo['width'] * 1.3 + "x" + user["blockList"][blockIndex].logo['height'] * 1.3, "-distort", "SRT", (.7 + (.3 - (val * .3))) + " 0", "-fill", "transparent", "-background", "transparent", "-gravity", "center", "-extent", user["blockList"][blockIndex].logo['width'] * 1.3 + "x" + user["blockList"][blockIndex].logo['height'] * 1.3, "-composite", "PNG32:" + Config.output_directory + id + path.sep + "data" + path.sep + "frames" + (blockIndex + 1) + path.sep + "logo-" + lclincrement.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + ".png"];

            }
            this.add_command(id, 'convert', cmdText);
        }

    }

    generateCommands = async function (user, id, blockIndex) {
        let cmdText = "";
        let iWid = Config.previewWidth;
        let iHei = Config.previewHeight;
        if (!user.isPreview) {
            iWid = Config.hdWidth;
            iHei = Config.hdHeight;
        }
        if (user["blockList"][blockIndex].background_settings.crop != "Fittoframe") {
            yHeight = Config.hdHeight;
            percentTotal = processResolution(id, Config.hdWidth, yHeight, user["blockList"][blockIndex].width, user["blockList"][blockIndex].height)
        }



        let frameIncrement = 0;

        startY = user.iHeight == Config.hdHeight ? 125 : 125
        y = startY;
        let destY = user.iHeight == Config.hdHeight ? 200 : 200
        let duration = 0
        if (blockIndex > 0) duration = user["blockList"][blockIndex].timing * 1000 - 300
        else {
            duration = user["blockList"][blockIndex].timing * 1000
            y = startY;

            destY = user.iHeight == Config.hdHeight ? 200 : 200
        }
        let tCount = 25
        let currentIncrement = 1

        for (let d = 0; d < tCount; d += currentIncrement) {
            frameIncrement++

            cmdText = ["-define", "png:color-type=6", user["blockList"][blockIndex].url, "-quality", "50", "-gravity", "north", "-resize", iWid + "x" + iHei + "!", "-extent", iWid + "x" + iHei + "+0+" + 0, "PNG32:" + Config.output_directory + id + path.sep + "data" + path.sep + "frames" + (blockIndex + 1) + path.sep + "fie-" + frameIncrement.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + ".png"];
            if (this.isDebug) {

                if (this.which == -1)
                    this.add_command(id, 'convert', cmdText);
                else if (this.which == blockIndex) {
                    this.add_command(id, 'convert', cmdText);
                }
            } else {
                this.add_command(id, 'convert', cmdText);
            }
        }

    }
    add_command = function (id, name, command) {
        let obj = new Object()
        obj.name = name
        obj.id = id
        obj.cmd = command
        Config.users[id].commands.push(obj)
    }
    processDimensions = async function (user, blockIndex, animation_style) {
        let maxFirst = user.maxFirstCrop;
        let maxHeightBound = 0;
        if (user.is_preview) {
            maxHeightBound = ((Config.hdHeight - 100) / Config.hdHeight) * Config.hdHeight;
        } else {
            maxHeightBound = user.maxHeightBound;
        }
        let maxHeightStart = user.maxHeightStart
        let maxWidthBound = user.maxWidthBound
        let maxWidthBoundCrop = user.maxWidthBoundCrop
        let maxFirstCrop = user.maxFirstCrop
        user["blockList"][blockIndex].lineslistheightMax = 0;
        if (animation_style == "blankslate" || animation_style == "standout") {

            let totalY = Math.abs(user["blockList"][blockIndex].linesListMain[0]["ascentLine"])
            for (let t = 0; t < user["blockList"][blockIndex].linesListMain.length; t++) {
                totalY += Math.abs(user["blockList"][blockIndex].linesListMain[t]["ascentLine"]) + Math.abs(user["blockList"][blockIndex].linesListMain[t]["descentLine"]) + 5
            }
            totalY -= (user["blockList"][blockIndex].linesListMain.last()["ascentLine"] + Math.abs(user["blockList"][blockIndex].linesListMain.last()["descentLine"]) + 5)
            totalY += Math.abs(user["blockList"][blockIndex].linesListMain.last()["descentLine"]) + Math.abs(user["blockList"][blockIndex].linesListSub[0]["ascentLine"]) + 5
            totalY += (20 / Config.hdHeight) * user.iHeight
            for (let t = 0; t < user["blockList"][blockIndex].linesListSub.length; t++) {
                totalY += Math.abs(user["blockList"][blockIndex].linesListSub[t]["ascentLine"]) + Math.abs(user["blockList"][blockIndex].linesListSub[t]["descentLine"]) + 5//+user["blockList"][blockIndex].linesListSub[t]["descentLine"]+5
            }
            let total_text_height = totalY
            if (total_text_height % 2 == 0) {
                user["blockList"][blockIndex].lineslistheightMax = parseInt(total_text_height);

            }
            else {
                user["blockList"][blockIndex].lineslistheightMax = parseInt(total_text_height) + 1;


            }
        }
        else
            if (animation_style == "bulletin") {
                let totalY = user["blockList"][blockIndex].linesListMain[0]["ascentLine"]
                for (let t = 0; t < user["blockList"][blockIndex].linesListMain.length - 1; t++) {
                    totalY += user["blockList"][blockIndex].linesListMain[t]["heightLine"] + 5
                }
                for (let t = 0; t < user["blockList"][blockIndex].linesListSub.length - 1; t++) {
                    totalY += user["blockList"][blockIndex].linesListSub[t]["heightLine"]//+user["blockList"][blockIndex].linesListSub[t]["descentLine"]+5
                    totalY += (30 / Config.hdHeight) * user.iHeight
                }
                totalY += 270
                let total_text_height = totalY
                if (total_text_height % 2 == 0) {
                    user["blockList"][blockIndex].lineslistheightMax = parseInt(total_text_height);
                }
                else {
                    user["blockList"][blockIndex].lineslistheightMax = parseInt(total_text_height) + 1;
                }

            } else {

                let totalY = 70 + user["blockList"][blockIndex].linesListMain[0]["ascentLine"]
                for (let t = 0; t < user["blockList"][blockIndex].linesListMain.length; t++) {
                    totalY += user["blockList"][blockIndex].linesListMain[t]["ascentLine"] + user["blockList"][blockIndex].linesListMain[t]["descentLine"] + 5
                }
                totalY -= (user["blockList"][blockIndex].linesListMain.last()["ascentLine"] + Math.abs(user["blockList"][blockIndex].linesListMain.last()["descentLine"]) + 5)

                for (let t = 0; t < user["blockList"][blockIndex].linesListSub.length; t++) {
                    totalY += user["blockList"][blockIndex].linesListSub[t]["ascentLine"] + user["blockList"][blockIndex].linesListSub[t]["descentLine"] + 5
                }

                totalY += Math.abs(user["blockList"][blockIndex].linesListMain.last()["descentLine"]) + user["blockList"][blockIndex].linesListSub[0]["heightLine"]

                let total_text_height = totalY
                if (total_text_height % 2 == 0) {
                    user["blockList"][blockIndex].lineslistheightMax = parseInt(total_text_height);

                }
                else {
                    user["blockList"][blockIndex].lineslistheightMax = parseInt(total_text_height) + 1;


                }



            }

        this.doAlign(user, animation_style, maxHeightBound, maxFirst, maxWidthBound, maxWidthBoundCrop, maxFirstCrop, maxHeightStart, blockIndex, user["blockList"][blockIndex].linesListMain, user["blockList"][blockIndex].linesListXAxis, user["blockList"][blockIndex].linesListYAxis, user["blockList"][blockIndex].linesWidthMain)
        this.doAlign(user, animation_style, maxHeightBound, maxFirst, maxWidthBound, maxWidthBoundCrop, maxFirstCrop, maxHeightStart, blockIndex, user["blockList"][blockIndex].linesListSub, user["blockList"][blockIndex].linesListXAxisSub, user["blockList"][blockIndex].linesListYAxisSub, user["blockList"][blockIndex].linesWidthSub)

        user["blockList"][blockIndex].increment = 0;
        user["blockList"][blockIndex].wWidth = Config.hdHeight;
        user["blockList"][blockIndex].hHeight = Config.hdWidth;
        if (user["blockList"][blockIndex].background_settings.crop == "left" || user["blockList"][blockIndex].background_settings.crop == "right") {

            user["blockList"][blockIndex].hHeight = user.iWidth / 2

            if (user.is_preview) {
                user["blockList"][blockIndex].wWidth = (user.iWidth / Config.hdHeight) * 240

                user["blockList"][blockIndex].hHeight = user.iWidth / 2
            }
        } else {
            if (user.is_preview) {
                user["blockList"][blockIndex].hHeight = user.iWidth
                user["blockList"][blockIndex].wWidth = (user.iWidth / Config.hdHeight) * 240

                user["blockList"][blockIndex].hHeight = user.iWidth
            }

        }


    }
    doAlign = function (user, animation_style, maxHeightBound, maxFirst, maxWidthBound, maxWidthBoundCrop, maxFirstCrop, maxHeightStart, blockIndex, linesList, linesListxAxis, linesListyAxis, linesWidth) {

        for (let gf = 0; gf < linesList.length; gf++) {
            let finalY = 0
            let subtractY = 0
            if (animation_style == "hiRise") {
                subtractY = user["blockList"][blockIndex].lineslistheightMax / 2

            }


            if (user["blockList"][blockIndex].alignV == "top") {
                let total_height = maxHeightStart
                finalY = total_height

                if (animation_style == "hiRise") {
                    finalY = 0
                }


            } else if (user["blockList"][blockIndex].alignV == "bottom") {

                let total_height = user["blockList"][blockIndex].lineslistheightMax

                finalY = (maxHeightBound - user["blockList"][blockIndex].lineslistheightMax)

                if (animation_style == "blankslate" || animation_style == "standout") {
                    finalY = (maxHeightBound - user["blockList"][blockIndex].lineslistheightMax) + maxHeightStart
                    //finalY = maxHeightStart
                } else
                    if (animation_style == "hiRise") {
                        if (user["blockList"][blockIndex].background_settings.crop == "left" || user["blockList"][blockIndex].background_settings.crop == "right" || user["blockList"][blockIndex].type == "text") {

                            finalY = (Config.hdHeight - total_height) + maxHeightStart

                        } else {

                            finalY = (Config.hdHeight - total_height) + maxHeightStart
                        }
                    }

            } else if (user["blockList"][blockIndex].alignV == "center") {
                let total_image_height = user["blockList"][blockIndex].lineslistheightMax

                let center = (((maxHeightBound / 2) - ((total_image_height / 2))) + maxHeightStart) - subtractY
                if (animation_style == "hiRise") {
                    center = maxHeightStart + ((maxHeightBound / 2) - (total_image_height / 2)) - 90

                }
                if (animation_style == "blankslate" || animation_style == "standout") {
                    center = (maxHeightStart + maxHeightBound / 2) - (total_image_height / 2)

                }
                if (user["blockList"][blockIndex].background_settings.cropped == "left" ||
                    user["blockList"][blockIndex].background_settings.cropped == "right") {
                    center = user["blockList"][blockIndex].lineslistheightMax / 2
                }
                if ((user["blockList"][blockIndex].background_settings.cropped == "left" ||
                    user["blockList"][blockIndex].background_settings.cropped == "right") && animation_style == "blankslate") {
                    center = maxHeightStart + ((maxHeightBound / 2) - (total_image_height / 2))
                }

                finalY = center
            }

            let finalX = 0
            if (user["blockList"][blockIndex].alignH == "right") {

                if (animation_style == "bulletin") {

                    if (user["blockList"][blockIndex].background_settings.crop == "left" || user["blockList"][blockIndex].background_settings.crop == "right") {
                        finalX = (maxWidthBound - parseInt(linesWidth[gf]))

                    } else {

                        finalX = (maxWidthBound - parseInt(linesWidth[gf]))

                    }
                } else {
                    if (user["blockList"][blockIndex].background_settings.crop == "left" || user["blockList"][blockIndex].background_settings.crop == "right") {
                        finalX = (maxWidthBoundCrop) - parseInt(linesWidth[gf])
                    } else {
                        finalX = (maxWidthBound - parseInt(linesWidth[gf]))
                    }

                }
            } else if (user["blockList"][blockIndex].alignH == "left") {
                if (animation_style == "bulletin") {

                    if (user["blockList"][blockIndex].background_settings.crop == "left" || user["blockList"][blockIndex].background_settings.crop == "right") {

                        finalX = maxFirstCrop
                    } else {

                        finalX = maxFirst

                    }
                } else {

                    if (user["blockList"][blockIndex].background_settings.crop == "left" || user["blockList"][blockIndex].background_settings.crop == "right") {

                        finalX = maxFirstCrop

                    } else {

                        finalX = maxFirst

                    }
                }
            } else if (user["blockList"][blockIndex].alignH == "center") {
                if (animation_style == "blankslate" || animation_style == "standout") {

                    if (user["blockList"][blockIndex].background_settings.crop == "left" ||
                        user["blockList"][blockIndex].background_settings.crop == "right") {
                        let mvBound = (maxWidthBound / 2)

                        finalX = (maxWidthBoundCrop / 2) - (
                            Math.max(...linesWidth) / 2)

                    } else {
                        finalX = (maxWidthBound / 2) - (
                            Math.max(...linesWidth) / 2)
                        if (user["blockList"][blockIndex].type == "quoteImage" || user["blockList"][blockIndex].type == "quoteVideo") {
                            finalX += maxFirst / 2
                        }


                    }
                } else
                    if (animation_style == "bulletin") {
                        if (user["blockList"][blockIndex].background_settings.crop == "left" ||
                            user["blockList"][blockIndex].background_settings.crop == "right") {
                            let mvBound = (maxWidthBound / 2)

                            finalX = (maxWidthBoundCrop / 2) - (
                                Math.max(...linesWidth) / 2)

                        } else {
                            finalX = (maxWidthBound / 2) - (
                                Math.max(...linesWidth) / 2)
                            if (user["blockList"][blockIndex].type == "quoteImage" || user["blockList"][blockIndex].type == "quoteVideo") {
                                finalX += maxFirst / 2
                            }


                        }
                    } else {
                        if (user["blockList"][blockIndex].background_settings.crop == "left" ||
                            user["blockList"][blockIndex].background_settings.crop == "right") {

                            finalX = (maxWidthBound / 2) -
                                (linesWidth[gf] / 2) + (maxFirst / 2)
                        } else {
                            finalX = (maxWidthBound / 2) -
                                (linesWidth[gf] / 2) + (maxFirst / 2)

                        }

                    }
            }

            linesListxAxis.push(parseInt(finalX))

            if (user.is_preview && !(user["blockList"][blockIndex].type == "text" || user["blockList"][blockIndex].type == "quoteImage" || user["blockList"][blockIndex].type == "quoteVideo")) {

                if (animation_style == "hiRise" && (user["blockList"][blockIndex].background_settings.crop == "left" || user["blockList"][blockIndex].background_settings.crop == "right" || user["blockList"][blockIndex].type == "text")) {

                    linesListyAxis.push(parseInt(finalY))

                } else {
                    linesListyAxis.push((parseInt(finalY) / Config.hdHeight) * 240)
                }

            } else {
                linesListyAxis.push(parseInt(finalY))


            }

        }
    }
    createDirectory = async function (directory) {
        try {
            fs.statSync(directory)

            fs.mkdirSync(directory)
        } catch (e) {
            Utils.deleteFolderRecursive(directory)
            fs.mkdirSync(directory);
        }

    }
}
module.exports = AnimationRun;