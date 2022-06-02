const utils = require('./utils.js');
const Config= require('./config.js');
const AnimBulletin = require('./AnimationBulletin.js');
const fs = require('fs').promises;
let path = require('path');
const express=require('express')
let app =express();
let amqp = require('amqplib/callback_api');
app.use(express.json());
app.use(function(req, res, next) {
  	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
app.use('/assets',express.static(__dirname +  path.sep+'assets'));
let preview_status = [];
let animBullet =new AnimBulletin("Bulletin");
let dynamicJson='\'{"name":"Project Name","uploadedMedia":[{"type":"photo","thumbnail":"http://192.168.1.107:82/assets/Image/id/print.jpg","url":"http://192.168.1.107:82/assets/Image/id/print.jpg"},{"type":"video","thumbnail":"http://192.168.1.107:82/assets/Footage/id/o.jpg","url":"http://192.168.1.107:82/assets/Footage/id/720p-sample1.mp4"},{"type":"photo","thumbnail":"http://192.168.1.107:82/assets/Image/id/o.jpg","url":"http://192.168.1.107:82/assets/Image/id/o.jpg"},{"type":"video","thumbnail":"http://192.168.1.107:82/assets/Footage/id/360p-sample1.jpg","url":"http://192.168.1.107:82/assets/Footage/id/270p-sample1.mp4"}],"global":{"backgroundMusic":{"source":"http://192.168.1.107:82/assets/Audio/audio.mpeg","volume":0.5,"loop":true,"trimAudio":{"trim":false,"value":{"start":0,"end":34}}},"filter":"none","aspectRatio":"landscape","style":"hiRise","font":"Roboto","watermark":{"source":"xxx","position":"top-right","size":"medium","transparency":true}},"blocks":[]}\';';
let server = require('http').Server(app);
let io = require('socket.io')(server);
server.listen(Config.port);

let modifyIndex =()=>{
	let assetsTemplateIndex = __dirname +  path.sep+'assets'+path.sep+'template_index';
	let assetsIndex = __dirname +  path.sep+'assets'+path.sep+'index.html';
	fs.readFile(assetsTemplateIndex, 'utf8').then((data)=>{
		  var result = data.replace(/192.168.1.107:82/g, Config.socket_ip);
		
		  fs.writeFile(assetsIndex, result, 'utf8');
		});

}
let storeData = function (data, path) {
	fs.writeFile(path,JSON.stringify(data)).catch(function(){console.error(err)});
}
let writeFileData = function(is_preview,id,id_string){
	return new Promise(function(resolve,reject){
		console.log(Config.output_directory+'id',id,id_string);
		fs.writeFile(Config.output_directory+'id',id.toString()).then(()=>
		resolve({isPreview:is_preview,error:null, result:{status : "succeed",id:id_string}}))
		.catch(function(err){
			console.log(err);
				resolve({isPreview:is_preview,error:'error', result:{status : "error",id:id_string}});
		});
})
}
let writeFolderId = function(is_preview,id) {
	return new Promise(function(resolve,reject){
		id=parseInt(id)+1;
		let id_string=id.toLocaleString('en-US', { minimumIntegerDigits: 10, useGrouping: false });
			let directory=Config.output_directory+id_string;
			utils.checkFileExists(directory).then(function(isExist){
				if(isExist){
					utils.deleteFolderRecursive(directory);
					fs.mkdir(directory).then(function(){
						fs.mkdir(directory+path.sep+"data"+path.sep);
					 	writeFileData(is_preview,id,id_string).then(function(val){
						resolve(val);
					 });
				});
				}else{
					fs.mkdir(directory).then(function(){
						fs.mkdir(directory+path.sep+"data"+path.sep);
						writeFileData(is_preview,id,id_string).then(function(val){
							resolve(val);
						 });
				}).catch(function(err){
					console.log(err);
						});
					}
				});
	});
};
modifyIndex();
app.get('/:id/:file', function (req, res) {
	let id = req.params.id
	let file = req.params.file
	let fileDownload = __dirname + path.sep+'download' + path.sep+id+ path.sep+file;
    res.download(fileDownload);
	
	
});
app.get('/', function (req, res) {
let jsonString='{"name":"Project Name","uploadedMedia":[{"type":"image","thumbnail":"http://localhost:82/assets/Image/id/print.jpg","url":"http://localhost:82/assets/Image/id/print.jpg"},{"type":"video","thumbnail":"http://localhost:82/assets/Footage/id/o.jpg","url":"http://localhost:82/assets/Footage/id/720p-sample1.mp4"},{"type":"image","thumbnail":"http://localhost:82/assets/Image/id/o.jpg","url":"http://localhost:82/assets/Image/id/o.jpg"},{"type":"video","thumbnail":"http://localhost:82/assets/Footage/id/360p-sample1.jpg","url":"http://localhost:82/assets/Footage/id/270p-sample1.mp4"}],"global":{"backgroundMusic":{"source":"http://localhost:82/assets/audio/audio.mpeg","volume":0.5,"loop":true,"trimAudio":{"trim":false,"value":{"start":0,"end":34}}},"filter":"none","aspectRatio":"landscape","style":"hiRise","font":"Roboto","watermark":{"source":"xxx","position":"top-right","size":"medium","transparency":true}},"blocks":[{"id":0,"type":"image","timing":3,"voiceover":{"present":false,"source":"","volume":1},"text":{"title":{"content":"Title text","fontSize":50,"color":"#ffffff"},"subTitle":{"content":"subtitle text","fontSize":20,"color":"#ffffff"},"legibility":false,"legibilityColor":"#000","accent":"#F8AF00","align":{"vertical":"center","horizontal":"center"}},"background":{"media":"http://localhost:82/assets/Image/id/print.jpg","scale":1,"position":{"x":0,"y":0},"rotate":0,"crop":"Fullscreen","color":"#ccc"}},{"id":1,"type":"video","timing":10,"trim":{"start":0,"end":10},"voiceover":{"present":false,"source":"","volume":1},"text":{"title":{"content":"Title text","fontSize":50,"color":"#ffffff"},"subTitle":{"content":"subtitle text","fontSize":20,"color":"#ffffff"},"legibility":false,"legibilityColor":"#000","accent":"#F8AF00","align":{"vertical":"center","horizontal":"center"}},"background":{"media":"http://localhost:82/assets/Footage/id/720p-sample1.mp4","sound":false,"volume":1,"scale":1,"position":{"x":0,"y":0},"rotate":0,"crop":"Fullscreen","color":"#ccc"}},{"id":2,"type":"image","timing":3,"voiceover":{"present":false,"source":"","volume":1},"text":{"title":{"content":"Title text","fontSize":50,"color":"#ffffff"},"subTitle":{"content":"subtitle text","fontSize":20,"color":"#ffffff"},"legibility":false,"legibilityColor":"#000","accent":"#F8AF00","align":{"vertical":"center","horizontal":"center"}},"background":{"media":"http://localhost:82/assets/Image/id/o.jpg","scale":1,"position":{"x":0,"y":0},"rotate":0,"crop":"Fullscreen","color":"#ccc"}},{"id":3,"type":"video","timing":10,"trim":{"start":0,"end":10},"voiceover":{"present":false,"source":"","volume":1},"text":{"title":{"content":"Title text","fontSize":50,"color":"#ffffff"},"subTitle":{"content":"subtitle text","fontSize":20,"color":"#ffffff"},"legibility":false,"legibilityColor":"#000","accent":"#F8AF00","align":{"vertical":"center","horizontal":"center"}},"background":{"media":"http://localhost:82/assets/Footage/id/270p-sample1.mp4","sound":false,"volume":1,"scale":1,"position":{"x":0,"y":0},"rotate":0,"crop":"Fullscreen","color":"#ccc"}}]}';
	res.send(
"<textarea id='json_text' rows='15' cols='50'>"+jsonString+"</textarea><br />"
+"<textarea id=\"myTextarea\"  rows='15' cols='50'></textarea><br /><input "
+"type=\"button\" id='clickMe' onclick='sendJSON(\"upload_json\");' value='Upload JSON'/><input "
+"type=\"button\" id='clickMe' onclick='sendJSON(\"preview_json\");' value='Preview JSON'/><script src=\"/socket.io/socket.io.js\"></script><script>function sendJSON(url){var xmlhttp = new XMLHttpRequest();xmlhttp.open('POST', '/'+url);xmlhttp.setRequestHeader('Content-Type', 'application/json');xmlhttp.send(document.getElementById('json_text').value);xmlhttp.onreadystatechange = function () {if (this.readyState == 4) {var json=JSON.parse(this.response);var socket = io('http://"+Config.socket_ip+"?id='+json.id);socket.on('status', function (data) {var pretty = JSON.stringify(data, undefined, 4);document.getElementById('myTextarea').value = pretty;});}}}</script>")})
app.post(/^\/(upload|preview)\_json$/, function (req, res) {
	let path=req.path.substring(1)
	if(path=="upload_json"){
		uploadJson(req.body,res,false)
	}else{
		uploadJson(req.body,res,true,false)
	}
});

let uploadJson = async function(json,res,isPreview=false,isTesting=false){
    console.log(isPreview,"PREVIEW");
    if(Config.connection!=null){
    	processJson(json,res,isPreview,isTesting);
    }else{
        amqp.connect('amqp://localhost', function(error0, connection) {
            if (error0) {
				throw(error0);
            }
            connection.createChannel(function(error1, channel) {
                Config.ch=channel
                if (error1) {
                    throw(error1);
                }
                processJson(json,res,isPreview,isTesting);
            })
        });
    }
}

let processJson = async function (json,res,is_preview=false,isTesting=false){
	let id="0";
	let pathUID=Config.output_directory+"id";
	let fileExistPromise = utils.checkFileExists(pathUID);
		fileExistPromise.then(function(value){
		let idNumberPromise = fs.readFile(pathUID);
		idNumberPromise.catch(function(err){
		}).then(function(idNumber){
			writeFolderId(is_preview,idNumber.toString().trim()).then(function(response){
				if(response.err){
					console.log("Already Exists");
					let js={id:"none",socket_url:Config.socket_ip};
					res.send(js);
				}else{
					console.log("Saved");
					id=response.result.id
					let js={id:response.result.id,socket_url:Config.socket_ip}
					res.send(js)		
					storeData(json,path.join(__dirname, 'download')+ path.sep+id+ path.sep+"data"+path.sep+"data.json")
					preview_status[id] = response.isPreview;
					dataUploaded()
				}
			}).catch(function(obj){
					console.log(obj);
			});
		});
	})
	.catch(function(value){
 		writeFolderId(is_preview,id.toString().trim()).then(function(value){
			if(value.err){
				console.log("Already Exists")
				let js={id:"none",socket_url:Config.socket_ip}
				res.send(js)
			}else{
				console.log("Saved")
				id=value.result.id
				let js={id:value.result.id,socket_url:Config.socket_ip}
				res.send(js)
				storeData(json,path.join(__dirname, 'download')+ path.sep+id+path.sep+"data"+path.sep+"data.json");
				preview_status[id] = value.isPreview;
				dataUploaded();
			}
		}).catch(function(obj){
			console.log(obj);
		});
	});
}
	
let dataUploaded = function(){
	io.use(function(socket, next){
		let id = socket.handshake.query.id
		let isPreview=preview_status[id];
		if(typeof(socket)==="undefined"){
				console.log("Undefined")
		}else{
			if(typeof(Config.users[id])==="undefined"){
					let obj={}
					obj.blockList=[]
					obj.socket = socket;
					Config.users[id]=(obj)
				if(isPreview){
					animBullet.run(id,true);
				}else{
					animBullet.run(id,false);
				}
			}
		}
	
		
		io.on('connection', function (socket) {
			if(!Config.users[id]){
				if(isPreview){
					Config.users[id].socket.emit('status', {'status':'started',
			'is_preview':'true'
			,video_url:{url:'none'} });
				}else{
					Config.users[id].socket.emit('status', {'status':'started',
					videos_progress:{'360p':0,'480p':0,'720p':0,'1080p':0}
					,videos_url:{'360p':'none','480p':'none','720p':'none','1080p':'none'} });
				}
				console.log("Connected");
			}
		  });
	  	next();          	  
	  });
}

io.on('disconnect', function () {
	Config.users[current.id].socket.removeAllListeners();
	Config.users[current.id].socket.disconnect()
	Config.users.splice(current.id,1)
	preview_status.splice(current.id,1)
});