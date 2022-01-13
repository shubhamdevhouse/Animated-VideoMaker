# Animated VideoMaker
### Create animatied text videos like Animoto using NodeJS -> ImageMagick & Ffmpeg

Note: On low configuration machine it can take time to process frames because it uses imagemagick to generate frame by frame transition or movement animation and after generating all blocks animation it merges them in a Video.
# Installation
# Prerequisite
**Install ImageMagick-7.1.0-Q16**
**Install Ffmpeg-20180209-e752da5**
**Download "Roboto" font**
Install RabbitMQ 3.8.2
Install imagemagick & extract ffmpeg
```
Open config.js and edit
	ffmpeg_path = "Installed path" (E:\\Ffmpeg\\ffmpeg.exe) Line : 3
	magick_path = "Installed path" (E:\\Imagemagick\\magick.exe) Line : 5
	convert_path = "Installed path" (E:\\Imagemagick\\convert.exe) Line : 4
	roboto_light = Robot Light font ttf file (E:\\Font\\Robot-Light.ttf) Line : 8
	roboto_bold = Robot Bold font ttf file (E:\\Font\\Robot-Bold.ttf) Line : 7
	socket_ip = Get current local ip of your local computer (ipconfig) Line : 10
	port = Port number must be same used in socket IP Line : 20
```
Open console window cd in the directory & run npm install
	
After that run command npm run start in one console window
	
run second command in other console window npm run worker
	
Run your ip address and port like http://192.168.1.107:82/assets/

Put video or pic url in url box

Select Type photo or video 

Put timing greater then 3 and less then 15 (Use less timing if you are on low configured machine because it take too much time too process frames and merge them in a video)

**Font size = Main text font size**

**Title = Animated text for main line**

**Sub font size = Sub text font size**

**Sub Title = Animated text for sub text line**

**Horizontal alignment of text = Left Right or Center**

**Vertical alignment of text = Top Bottom or Center**

**Crop style you can check demo videos**

**Click on Add Row** to add blocks like first is photo and second is video then photo or ...

**Click on Submit HD Video** to generate frames and merge them in video in 1080,720,360,240 resolution

# Demo Videos

Video = Type || Alignment Horizontal = Left || Alignment Vertical = Top || Crop = Full

https://user-images.githubusercontent.com/35697452/144758975-e5889178-a94d-4251-a88d-ea842378e59e.mp4

Video = Type || Alignment Horizontal = Right || Alignment Vertical = Bottom || Crop = Full

https://user-images.githubusercontent.com/35697452/144758981-95b17aad-44c2-4d9f-81a9-806392ef45c7.mp4

Video = Type || Alignment Horizontal = Center || Alignment Vertical = Center || Crop = Full

https://user-images.githubusercontent.com/35697452/144759017-28af9cf8-67ec-4ffb-b0e0-992885fc607f.mp4

Video = Type || Alignment Horizontal = Left || Alignment Vertical = Top || Crop = Fitoframe

https://user-images.githubusercontent.com/35697452/144759039-3b727d45-6fbb-4ded-a9ce-de1f129177da.mp4

Video = Type || Alignment Horizontal = Left || Alignment Vertical = Top || Crop = Left

https://user-images.githubusercontent.com/35697452/144759070-eaed6e25-4f8d-4b82-92bb-c58c2e61bae9.mp4

Photo = Type || Alignment Horizontal = Left || Alignment Vertical = Top || Crop = Full

https://user-images.githubusercontent.com/35697452/144759162-d7b1d94e-1c75-4c5b-9126-3756bf8382ea.mp4

Photo = Type || Alignment Horizontal = Right || Alignment Vertical = Bottom || Crop = Full

https://user-images.githubusercontent.com/35697452/144759177-bdbac2ef-16c6-43de-ac40-6632fb7be7d7.mp4

Photo = Type || Alignment Horizontal = Center || Alignment Vertical = Center || Crop = Full

https://user-images.githubusercontent.com/35697452/144759184-6b4241ac-5817-4bea-ac19-0a066db46740.mp4



# Todo :

### More animation theme.

### Optimization & cleaning of code.
