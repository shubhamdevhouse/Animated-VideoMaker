const utils=require('./utils.js')
const {parentPort,workerData}=require('worker_threads');
    utils.runProcess(workerData.name,workerData.cmd).then((data)=>{
    if(typeof(workerData.j)!=='undefined'){
	   parentPort.postMessage({ j:workerData.j,id:workerData.id,index:workerData.index,fileName: workerData.name,file_name:workerData.file_name,cmd:workerData.cmd, status: 'Done' })
	}else{
       parentPort.postMessage({ id:workerData.id,index:workerData.index,fileName: workerData.name,file_name:workerData.file_name,cmd:workerData.cmd, status: 'Done' })
    }
   })
    

   