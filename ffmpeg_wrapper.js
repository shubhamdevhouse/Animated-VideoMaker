"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
/**
 * convert HH:MM:SS.mss to milliseconds
 */
function humanTime2msec(timeString) {
    const [h, m, s] = timeString.split(':').map(Number);
    return Math.round(h * 36e5 + m * 6e4 + s * 1e3);
}
/**
 *
 * @param data
 * @param duration video duration (milliseconds)
 */
function parseProgress(data, duration,index) {
    if (data.startsWith('frame=')) {
        const evt = {};
        const info = data
            .replace(/=\s+/g, '=')
            .trim()
            .split(/\s+/g);
        info.forEach(kv => {
            const [k, v] = kv.split('=');
            switch (k) {
                case 'frame':
                case 'fps':
                    evt[k] = +v;
                    break;
                case 'bitrate':
                case 'speed':
                    evt[k] = Number.parseFloat(v);
                    break;
                case 'Lsize':
                case 'size':
                    evt['size'] = Number.parseInt(v) * 1024;
                    break;
                case 'total_size':
                    evt['size'] = +v;
                    break;
                case 'out_time':
                case 'time':
                    evt['time'] = v;
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    evt.time_ms = humanTime2msec(evt.time);
                    break;
                default:
                    if (v) {
                        evt[k] = v;
                    }
                    break;
            }
        });
		  evt.index=index
        if (duration) {
            evt.percentage = +((100 * evt.time_ms) / duration).toFixed(2);
            evt.remaining = Math.floor((duration - evt.time_ms) * evt.speed);
        }
        return evt;
    }
    return;
}
exports.parseProgress = parseProgress;
/**
 * Extract progress status from FFMPEG stderr.
 * @public
 */
class FFMpegProgress extends stream_1.Transform {
    /**
     * Creates an instance of FFMpegProgress.
     * @param duration - video duration (milliseconds)
     * If parameter is omitted - will attempt to auto-detect media duration
     */
    constructor(duration = 0,index=0) {
        super({
            readableObjectMode: true,
            writableObjectMode: true
        });
        this.duration = duration;
		this.index=index
        /**
         * last ffmpeg stderr message
         * @beta
         */
        this.exitMessage = '';
    }
    _transform(chunk, encoding, done) {
        const str = chunk.toString();
        const evt = parseProgress(str, this.duration,this.index);
        if (evt) {
            this.push(evt);
        }
        else {
            if (!this.duration && !evt) {
                const re = /(^|Duration: )(\d\d:\d\d:\d\d\.\d\d)/;
                const match = re.exec(str);
                if (match && match[2]) {
                    this.duration = humanTime2msec(match[2]);
                }
            }
            this.exitMessage = str.split('\n').splice(-2)[0];
        }
        done();
    }
}
exports.FFMpeg_Wrapper = FFMpegProgress;
