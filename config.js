const path = require('path');
class Config{
    static ffmpeg_path = "C:\\Users\\shubh\\Downloads\\ffmpeg-20180209-e752da5-win64-static (1)\\ffmpeg-20180209-e752da5-win64-static\\bin\\ffmpeg";
    static convert_path = "C:\\Program Files\\ImageMagick-7.1.0-Q16\\magick";
    static magick_path = "C:\\Program Files\\ImageMagick-7.1.0-Q16\\magick";
    static output_directory = path.join(__dirname, 'download')+path.sep;
    static roboto_bold = "F:\\Font\\Roboto-Bold.ttf";
    static roboto_light = "F:\\assets\\Font\\Roboto-Light.ttf";
    static audio = "F:\\assets\\Audio\\audio.mpeg";
    static socket_ip="192.168.1.107:82";
    static users=[];
    static connecton=null;
    static ch=null;
    static extVideos=[".avi",".mov",".mp4"];
    static extImages=[".png",".jpg",".jpeg"];
    static hdWidth = 1920;
    static hdHeight = 1080;
    static previewWidth = 426;
    static previewHeight = 240;
    static port = 82;
}
module.exports=Config;