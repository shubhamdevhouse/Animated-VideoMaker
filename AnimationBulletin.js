const path = require("path");
const fs = require('fs');
const Utils  = require('./utils');
const Config =require('./config');
const AnimationRun = require('./AnimationRun');
class AnimBulletin extends AnimationRun {
reset = function(user,blockId){
    user["blockList"][blockId].lineslistheightMax = 0;
    user["blockList"][blockId].increment = 0;
    user["blockList"][blockId].maxFirst = 0;
    user["blockList"][blockId].currentInY = 0;
    user["blockList"][blockId].wordsListMain = [];
    user["blockList"][blockId].wordsListSub = [];
    user["blockList"][blockId].linesListMain = [];
    user["blockList"][blockId].linesListSub = [];
}
run = async function(id, isPreview){
    await this.runAnimation(id,isPreview);
    let user = Config.users[id];
        try {
            this.font = this.global_data.font
            let offsetY = 0;
            for (let blockId = 0; blockId < user["blockList"].length; blockId++) {
                this.reset(user,blockId);
                await this.doProcessText(id, blockId,user.animation_style);
                await this.processDimensions(user, blockId,user.animation_style);
                let maxWidthBound = user.maxWidthBound;
                let maxFirstCrop = user.maxFirstCrop;
                let destY = 0;
                let y = 0;
                let timing=0;
                let cmdText = "";
                let frameIncrement = 0;
                if (user["blockList"][blockId].type == "photo" || user["blockList"][blockId].type == "quoteImage") {
                    cmdText = "";
                    let percentTotal = 100
                    if (user["blockList"][blockId].background_settings.crop != "Fittoframe") {
                        let yHeight = 1080
                        percentTotal = this.processResolution(id, Config.hdWidth, yHeight, user["blockList"][blockId].width, user["blockList"][blockId].height)
                    }
                    
                    let startY = 0;
                    y = startY;
                    let duration = 0
                    destY = 5;
                    if (blockId > 0) {
                        startY = 0;
                        y = startY;
                        destY = 5; duration = 300;
                    }
                    else {
                        startY = 0;
                        destY = 134;
                    }
                    let start = Date.now();
                    let stop = false
                    let end = start + duration;
                    startY = -(user.iHeight);
                    y = startY;
                    destY = 0;
                    duration = 0;
                    if (blockId > 0) duration = 300;
                        start = Date.now();
                        stop = false;
                        end = start + duration;
                        frameIncrement = 0;
                        startY = user.iHeight == 1080 ? 125 : 125;
                        y = startY;
                        destY = user.iHeight == 1080 ? 200 : 200
                        duration = 0
                        if (blockId > 0) duration = user["blockList"][blockId].timing * 1000 - 300
                        else {
                            duration = user["blockList"][blockId].timing * 1000;
                            y = startY;
                            destY = user.iHeight == 1080 ? 200 : 200;
                        }
                    start = Date.now();
                    timing = (user["blockList"][blockId].timing) * 30
                    end = start + duration;
                    let currentIncrement = 1;
                    let resize_command = [];
                    if (isPreview) {
                        resize_command.push("-resize")
                        if (user["blockList"][blockId].background_settings.crop == "left" || user["blockList"][blockId].background_settings.crop == "right") {
                            resize_command.push(213 + "x" + Config.previewHeight)
                        } else {
                            resize_command.push(Config.previewWidth + "x" + Config.previewHeight)
                        }
                    }
                    for (let iFrame = 0; iFrame < timing; iFrame += currentIncrement) {
                        frameIncrement++
                        if (stop) {
                            break;
                        }
                        
                        let val = iFrame / timing;
                        let heightAfter = user["blockList"][blockId].height * percentTotal;
                        offsetY = heightAfter - user["blockList"][blockId].height
                        cmdText = ["convert", "-depth", "8", "-define", "PNG:compression-level=9",
                        "-define", "PNG:compression-strategy=2", "-size",
                        user["blockList"][blockId].hHeight + "x1080", "xc:white",
                        "(", user["blockList"][blockId].url, "-quality", "40", "-gravity",
                        "center", "-resize", (percentTotal) + "%", "-extent",
                         +user["blockList"][blockId].hHeight + "x1080+0+" + 0,
                          "-define",
                           "distort:viewport=" + user["blockList"][blockId].hHeight + "x1080+0+0",
                            "-gravity", "center", "-distort", "SRT", (1 + (val * 0.05)) + " 0", ")",
                             "-composite", "-gravity", "center", ...resize_command, "-define",
                              "PNG:compression-level=9", "-define", "PNG:compression-strategy=2",
                               Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (blockId + 1) + path.sep + "fie-" + frameIncrement.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + "." + "jpg"];
                        if (this.isDebug) {
                            if (this.which == -1)
                            this.add_command(id, 'convert', cmdText);
                            else if (this.which == blockId) { this.add_command(id, 'convert', cmdText); }
                        } else {
                            this.add_command(id, 'convert', cmdText);
                        }
                    }
    
                
            } else if (user["blockList"][blockId].type == "logoVideo" ) {
                await this.generateLogo(user,id,blockId);
            } else if (user["blockList"][blockId].type == "logoText" ) {
                let size = Config.previewWidth+"x"+Config.previewHeight;
                if (!isPreview) {
                    size = (Config.hdWidth + "x" + Config.hdHeight);
                }
                cmdText = [ "-size",size  ,"xc:"+user["blockList"][blockId].accent ,"-quality","50",
                 Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (blockId + 1) + path.sep + "fiebg.jpg"];
                this.add_command(id, 'convert', cmdText);
                await this.generateLogo(user,id,blockId);
            } else if (user["blockList"][blockId].type == "logoImage" ) {
                await this.generateLogo(user,id,blockId);
                await this.generateCommands(user,id,blockId);
            }  
            offsetY = 90;
            if (user["blockList"][blockId].type == "text" || user["blockList"][blockId].background_settings.crop == "right" || user["blockList"][blockId].background_settings.crop == "left" || user["blockList"][blockId].type == "quoteImage" || user["blockList"][blockId].type == "quoteVideo") {
                if (user["blockList"][blockId].type == "text" || user["blockList"][blockId].background_settings.crop == "right" || user["blockList"][blockId].background_settings.crop == "left") {
                    offsetY = user["blockList"][blockId].linesListYAxis[0] + 90;
                } else {
                    offsetY = user["blockList"][blockId].linesListYAxis[0];
                }
            }
    
            if (user["blockList"][blockId].type == "logoImage" || user["blockList"][blockId].type == "logoVideo"  ||  user["blockList"][blockId].type == "logoText" ) {
                await generateTextBulletin(id,blockId)
            }else{
                /*TEXT AND SUBTITLE*/
                let startY = user.iHeight == 1080 ? 200 : 200;
                destY = user.iHeight == 1080 ? 125 : 125;
                timing = (user["blockList"][blockId].timing) * 30;
                if (blockId <= 0) {
                    startY = user.iHeight == 1080 ? 200 : 200;
                    timing = ((user["blockList"][blockId].timing) * 30);
                    y = startY;
                }

                if (user["blockList"][blockId].type == "text") {
                    timing = (user["blockList"][blockId].timing - 1) * 30;
                }
                
                let secondAnimStart = 16;
                let thirdAnimStart = 24;
                let forthAnimStart = (user["blockList"][blockId].timing == 3) ? 49 :
                    (user["blockList"][blockId].timing == 4) ? 54 : 59;
                let textYAxis=0;
                let yAxis = 0;
                let vopacity = 0;
                let totalY=0;
                let valX = 0;
                let xAxis =0;
                let curIndex = 0;
                let valueOpacity = 0;
                let currentTIndex = 0;
                let halfTiming = timing < 30 ? 20 : 30;
                let currentLine = user["blockList"][blockId].linesListMain.length
                let xStart = forthAnimStart
                for (let i = 0; i < user["blockList"][blockId].linesListSub.length; i++) {
                    user["blockList"][blockId].linesListSub[i]["preStartRectangle"] = xStart + 1
                    user["blockList"][blockId].linesListSub[i]["start"] = xStart
                    user["blockList"][blockId].linesListSub[i]["end"] = (
                        (user["blockList"][blockId].timing == 3) ? 9 :
                            (user["blockList"][blockId].timing == 4) ? 15 : 20);
    
                    user["blockList"][blockId].linesListSub[i]["iAfter"] = 0;
                    user["blockList"][blockId].linesListSub[i]["t"] = 0;
                    user["blockList"][blockId].linesListSub[i]["preEndRectangle"] = xStart + 1 + (
                        (user["blockList"][blockId].timing == 3) ? 12 :
                            (user["blockList"][blockId].timing == 4) ? 17 : 22)
                    xStart += 1 + (
                        (user["blockList"][blockId].timing == 3) ? 5 :
                            (user["blockList"][blockId].timing == 4) ? 6 : 7)
                    user["blockList"][blockId].linesListSub[i]["nextStartRectangle"] = xStart + 1
    
                }
                let totalSubLines = 1;
                let resize_command = []
                if (isPreview) {
                    resize_command.push("-resize")
                    if (user["blockList"][blockId].background_settings.crop == "left" || user["blockList"][blockId].background_settings.crop == "right") {
    
                        resize_command.push(213 + "x" + Config.previewHeight)
    
                    } else {
                        resize_command.push(Config.previewWidth + "x" + (user["blockList"][blockId].lineslistheightMax / 1080) * Config.previewHeight)
    
                    }
    
                }
                for (let d = 0; d < timing; d++) {
                    if (d > 15) {
                        vopacity = curIndex / halfTiming > 1.0 ? 1.0 : (curIndex / halfTiming);
                        curIndex++;
                    }
                    valueOpacity = (currentTIndex / timing) >= 1.0 ? 1.0 : (currentTIndex / timing);
                    currentTIndex++;
                    frameIncrement++;
                    let cmdText = []
                    if (user["blockList"][blockId].type == "text") {
                        cmdText = ["convert", "-quality", "40", "-size"];
                        if (valueOpacity > 0) {
                            cmdText.push(this.mainWidth + "x" + this.mainHeight)
                        } else {
                            if (isPreview) {
                                cmdText.push(Config.previewWidth + "x" + Config.previewHeight)
                            } else {
                                cmdText.push(Config.hdWidth + "x" + 1080)
                            }
                        }
                        cmdText.push("xc:" + user["blockList"][blockId].background_settings["color"])
                    } else if (user["blockList"][blockId].background_settings.crop == "left" || user["blockList"][blockId].background_settings.crop == "right") {
                        cmdText = ["convert", "-define", "png:color-type=6", "-quality", "40", "-size"];
                        if (valueOpacity > 0) {
                            cmdText.push(this.mainWidth + "x" + 1080)
                        } else {
                            if (isPreview) {
                                cmdText.push(Config.previewWidth + "x" + Config.previewHeight)
                            } else {
                                cmdText.push(Config.hdWidth + "x" + user["blockList"][blockId].lineslistheightMax)
                            }
                        }
                        cmdText.push("xc:none")
                    }
                    else {
                        cmdText = ["convert", "-define", "png:color-type=6", "-quality", "40", "-size"];
                        if (valueOpacity > 0) {
                            cmdText.push(this.mainWidth + "x" + user["blockList"][blockId].lineslistheightMax)
                        } else {
                            if (isPreview) {
    
                                cmdText.push(Config.previewWidth + "x" + user["blockList"][blockId].lineslistheightMax)
                            } else {
    
    
                                cmdText.push(Config.hdWidth + "x" + user["blockList"][blockId].lineslistheightMax)
                            }
                        }
                        cmdText.push("xc:none")
                    }
                    cmdText.push("-fill")
                    cmdText.push(user["blockList"][blockId].text[0]["color"])
                    cmdText.push("-font")
                    cmdText.push(this.fontBold)
                    cmdText.push("-pointsize")
                    cmdText.push(user["blockList"][blockId].text[0]["fontSize"])
    
                    if (valueOpacity > 0) {
                        let finalX = user["blockList"][blockId].linesListXAxis[0]
                        if (user["blockList"][blockId].increment >= 0) {
                            cmdText.push("(")
                            cmdText.push("xc:transparent")
                            let n = (user["blockList"][blockId].increment / 15)
                            let valYVerticalLine = user["blockList"][blockId].increment >= 15 ? 1 : n * (2 - n);
    
                            textYAxis = user["blockList"][blockId].type == "text" || user["blockList"][blockId].background_settings.crop == "left" || user["blockList"][blockId].background_settings.crop == "right" ? user["blockList"][blockId].linesListYAxis[0] : 0
                            cmdText.push("-fill")
                            cmdText.push(user["blockList"][blockId].accent)
                            cmdText.push("-draw")
                            totalY = textYAxis + this.getHeightCharacter(user.animation_style, currentLine, user["blockList"][blockId].linesListMain, "Main")
                            let vY = user["blockList"][blockId].type == "text" || user["blockList"][blockId].background_settings.crop == "left" || user["blockList"][blockId].background_settings.crop == "right" ? user["blockList"][blockId].linesListYAxis[0] : 0
                            let tY = vY + ((totalY - vY) * valYVerticalLine)
                            yAxis = user["blockList"][blockId].type == "text" || user["blockList"][blockId].background_settings.crop == "left" || user["blockList"][blockId].background_settings.crop == "right" ? user["blockList"][blockId].linesListYAxis[0] : 0
    
    
                            let startX = finalX;
                            let incValueFinalX = finalX + 18;
                            let endRect = parseInt(Math.max(...user["blockList"][blockId].linesWidthMain) + incValueFinalX + 30)
                            if (user["blockList"][blockId].alignH == "right") {
                                finalX = maxWidthBound;
                                incValueFinalX = finalX + 18;
                                endRect = incValueFinalX - parseInt(Math.max(...user["blockList"][blockId].linesWidthMain)) - 30
                            } else {
                                startX += 18;
                            }
    
                            cmdText.push("rectangle " + finalX + "," + tY + " " + incValueFinalX + "," + parseInt(vY))
                            if (user["blockList"][blockId].increment >= secondAnimStart && user["blockList"][blockId].legibility) {
                                cmdText.push("-fill");
                                let clr = Utils.hexToRgb(user["blockList"][blockId].legibilityColor);
                                cmdText.push("rgba(" + clr.r + "," + clr.g + "," + clr.b + "," + ((valueOpacity * 0.50) + 0.1) + ")");
                                cmdText.push("-draw");
                                cmdText.push("rectangle " + startX + "," + (vY) + " " + endRect + "," + (totalY + 1));
                            }
                            cmdText.push(")");
                            cmdText.push("-composite");
                        }
                        if (user["blockList"][blockId].increment >= secondAnimStart) {
                            cmdText.push("(")
                            cmdText.push("xc:transparent")
                            let ne = (user["blockList"][blockId].increment - secondAnimStart) / (thirdAnimStart - secondAnimStart)
                            valX = user["blockList"][blockId].increment > thirdAnimStart >= 1 ? 1 : ne * (2 - ne)
                            
                            //textYAxis = 90 + (Math.abs(user["blockList"][blockId].linesListMain[0]["nDescentLine"]) + 5)
                            textYAxis = 40 + (Math.abs(user["blockList"][blockId].linesListMain[0]["nDescentLine"]) + 5)
                            for (let ieg = 0; ieg < currentLine; ieg++) {
                                let gf = ieg + 1;
                                if (user["blockList"][blockId].alignH == "right") {
                                    finalX = (maxWidthBound)
                                } else {
                                    finalX = user["blockList"][blockId].linesListXAxis[ieg] + 30
                                }
                                let text = user["blockList"][blockId].linesListMain[ieg]["textLine"]
                                if (valueOpacity > 0) {
                                    cmdText.push("-fill")
                                    let clr = Utils.hexToRgb(user["blockList"][blockId].text[0]["color"])
                                    cmdText.push("rgba(" + clr.r + "," + clr.g + "," + clr.b + "," + 1 + ")");
                                    cmdText.push("-annotate")
                                    if (user["blockList"][blockId].alignH == "right") {
                                        let width_line = Math.max(...user["blockList"][blockId].linesWidthMain)
                                        let current_width_line = user["blockList"][blockId].linesWidthMain[ieg]
                                        cmdText.push("+" + ((width_line - current_width_line)) + "+" + textYAxis)
                                        } else if (user["blockList"][blockId].alignH == "center") {
                                            cmdText.push("+" + (maxFirstCrop + 10) + "+" + textYAxis);
                                        } else {
                                            if (ieg > 0) {
                                                cmdText.push("+" + (finalX + 10) + "+" + textYAxis);
                                            } else {
                                                cmdText.push("+" + (finalX + 10) + "+" + textYAxis);
                                            }
                                        }
                                    cmdText.push(text);
                                }
                                if(ieg < currentLine-1){
                                    textYAxis += ( +(user["blockList"][blockId].linesListMain[ieg+1]["nDescentLine"]) )
                                }
                              }
    
                                if (user["blockList"][blockId].alignH == "right") {    
                                let width_line = Math.max(...user["blockList"][blockId].linesWidthMain)
                                let xMovement = (1 + ((width_line - 1) * valX))
                                xAxis = xMovement
                                let xFinal = (finalX - Math.abs(xAxis)) - 18
                                cmdText.push("-crop")
                                cmdText.push(xAxis + "x" + user["blockList"][blockId].lineslistheightMax + "+" + 0 + "-" + 0)
                                cmdText.push("-geometry")
                                cmdText.push("+" + xFinal + "+" + (yAxis))
                                
                            } else
                                if (user["blockList"][blockId].alignH == "center") {
                                    let width_line = Math.max(...user["blockList"][blockId].linesWidthMain)
                                    let xMovement = (width_line
                                        + (((maxFirstCrop + 10) - width_line) * valX))
                                    let xAxis = xMovement;
                                    cmdText.push("-crop")
                                    cmdText.push((width_line + 30) + "x" + user["blockList"][blockId].lineslistheightMax + "+" + xAxis + "+" + 0)
                                    cmdText.push("-geometry")
                                    cmdText.push("+" + finalX + "+" + (yAxis))
                                } else {
                                    let width_line = Math.max(...user["blockList"][blockId].linesWidthMain);
                                    let xMovement = ((width_line)
                                        + ((finalX - width_line) * valX))
                                    let xAxis = xMovement
                                    cmdText.push("-crop")
                                    cmdText.push((width_line + 30) + "x" + user["blockList"][blockId].lineslistheightMax + "+" + xAxis + "+" + 0)
                                    cmdText.push("-geometry")
                                    cmdText.push("+" + finalX + "+" + (yAxis))
                                }
                            cmdText.push(")")
                            cmdText.push("-composite")
                        }
                        totalY += (30 / Config.hdHeight) * user.iHeight
                        let totalYY = totalY
    
                        if (user["blockList"][blockId].increment >= forthAnimStart) {
                            for (let i = 0; i < totalSubLines; i++) {
                                let text = user["blockList"][blockId].linesListSub[i]["textLine"]
    
                                cmdText.push("(")
                                cmdText.push("xc:transparent")
    
    
                                textYAxis = offsetY
                            
                                let clr = Utils.hexToRgb(user["blockList"][blockId].text[0]["color"])
    
                                cmdText.push("-fill")
                                cmdText.push("rgba(" + clr.r + "," + clr.g + "," + clr.b + "," + valueOpacity + ")");
    
    
                                textYAxis += (60 / Config.hdHeight) * user.iHeight
                                if (user["blockList"][blockId].alignH == "right") {
                                    finalX = (maxWidthBound) + 30
                                } else {
                                    finalX = user["blockList"][blockId].linesListXAxis[0] + 30
                                }
                                cmdText.push("-fill")
                                cmdText.push(user["blockList"][blockId].accent)
                                let cX = (finalX) - 30
                                let endX = cX + user["blockList"][blockId].linesWidthSub[i] + 30
                                let ne = (user["blockList"][blockId].increment - user["blockList"][blockId].linesListSub[i]["preStartRectangle"]) / (user["blockList"][blockId].linesListSub[i]["preEndRectangle"] - user["blockList"][blockId].linesListSub[i]["preStartRectangle"])
                                valX = ne >= 1 ? 1 : ne <= 0 ? 0 : Math.sin(ne * Math.PI / 2)
                                valX = valX < 0 ? 0 : valX
                                if (user["blockList"][blockId].alignH == "right") {
                                    cX = maxWidthBound - 30 - 18
                                    let cxS = (cX - user["blockList"][blockId].linesWidthSub[i])
                                    endX = cX + 30 + 18 + 18
                                    let xMovement = cX
                                        + (cxS - cX) * valX
                                    cX = xMovement + 4
                                } else {
                                    cX = (finalX)
                                    let cxS = cX + user["blockList"][blockId].linesWidthSub[i] + 30
                                    endX = cX - 30
                                    let xMovement = cX
                                        + (cxS - cX) * valX
                                    cX = xMovement
                                }
                                if (valX != 0) {
                                    cmdText.push("-draw")
                                    cmdText.push("rectangle " + ((cX)) + "," + (totalYY - 4) + " " + endX + "," + (totalYY + user["blockList"][blockId].linesListSub[i]["ascentLine"] + user["blockList"][blockId].linesListSub[i]["descentLine"] + 4))
                                }
                                cmdText.push(")");
                                cmdText.push("-composite")
                                if (user["blockList"][blockId].increment >= user["blockList"][blockId].linesListSub[i]["start"]) {
                                    cmdText.push("(")
    
                                    cmdText.push("xc:transparent")
                                    cmdText.push("-fill")
                                    clr = Utils.hexToRgb(user["blockList"][blockId].text[1]["color"])
                                    cmdText.push("rgba(" + clr.r + "," + clr.r + "," + clr.r + "," + (vopacity) + ")")
    
    
                                    if (user["blockList"][blockId].linesListSub[i]["iAfter"] > user["blockList"][blockId].linesListSub[i]["end"]) {
    
                                        user["blockList"][blockId].linesListSub[i]["t"] = 1
                                    } else {
    
                                        user["blockList"][blockId].linesListSub[i]["t"] = parseFloat(user["blockList"][blockId].linesListSub[i]["iAfter"] / user["blockList"][blockId].linesListSub[i]["end"])
                                        user["blockList"][blockId].linesListSub[i]["iAfter"] += 1
                                        
                                    }
                                    let valX = Math.sin(user["blockList"][blockId].linesListSub[i]["t"] * Math.PI / 2);
                                    cmdText.push("-font")
                                    cmdText.push(this.subFont)
                                    cmdText.push("-pointsize")
                                    cmdText.push(user["blockList"][blockId].text[1]["fontSize"])
                                    if (user["blockList"][blockId].alignH == "right") {
                                        let current_width_line = user["blockList"][blockId].linesWidthSub[i]
    
                                        let xMovement = (1 + ((current_width_line - 1) * valX))
                                        let xAxis = xMovement
    
                                        let xFinal = finalX - Math.abs(xAxis) - 18
    
                                        if (valueOpacity > 0) {
                                            cmdText.push("-annotate")
                                            cmdText.push("+" + (0) + "+" + (totalYY + user["blockList"][blockId].linesListSub[i]["ascentLine"]))
                                            cmdText.push(text)
                                            cmdText.push("-crop")
                                            cmdText.push(xAxis + "x" + (user["blockList"][blockId].linesListSub[i]["descentLine"] + user["blockList"][blockId].linesListSub[i]["ascentLine"] + totalYY) + "+" + 0 + "+" + 0)
                                            cmdText.push("-geometry")
                                            cmdText.push("+" + (xFinal - 30) + "+" + 0)
                                        }
                                    } else {
                                        let width_line = user["blockList"][blockId].linesWidthSub[i] + 18
    
                                        //let xFinal = finalX + Math.abs(xAxis)
    
                                        let xMovement = (1 + (width_line - 1) * valX)
                                        xAxis = xMovement
    
    
    
                                        if (valueOpacity > 0) {
                                            cmdText.push("-annotate")
                                            cmdText.push("+" + 18 + "+" + (totalYY + user["blockList"][blockId].linesListSub[i]["ascentLine"]))
                                            cmdText.push(text)
                                            cmdText.push("-crop")
                                            cmdText.push(xAxis + "x" + (user["blockList"][blockId].linesListSub[i]["heightLine"] + totalYY) + "+" + (width_line - xAxis) + "+" + 0)
                                            cmdText.push("-geometry")
                                            cmdText.push("+" + (finalX) + "+" + 0)
                                        }
    
                                    }
                                    cmdText.push(")")
                                    cmdText.push("-composite")
    
                                }
    
                                totalYY += user["blockList"][blockId].linesListSub[i]["ascentLine"] + user["blockList"][blockId].linesListSub[i]["descentLine"]
                                totalYY += (40 / Config.hdHeight) * user.iHeight
                            }
    
                            if (user["blockList"][blockId].increment > (user["blockList"][blockId].linesListSub.length >= totalSubLines) ? user["blockList"][blockId].linesListSub[totalSubLines - 1]["nextStartRectangle"] : user["blockList"][blockId].linesListSub[totalSubLines]["nextStartRectangle"]) {
                                if (totalSubLines >= user["blockList"][blockId].linesListSub.length) {
                                    totalSubLines = user["blockList"][blockId].linesListSub.length
                                } else {
                                    totalSubLines++;
                                }
                            }
                        }
                    }
                    if (user["blockList"][blockId].increment >= 0) {
                    }
    
    
    
                    if (user["blockList"][blockId].background_settings.crop != "left" && user["blockList"][blockId].background_settings.crop != "right") {
    
    
    
    
                        cmdText.push("-background")
                        cmdText.push("transparent")
                    } else {
                        cmdText.push("-background")
                        cmdText.push(user["blockList"][blockId].background_settings.color)
    
    
                     }
                    
                    if (user["blockList"][blockId].type == "quoteImage" || user["blockList"][blockId].type == "quoteVideo") {
    
                        cmdText.push("-resize")
    
    
    
                        cmdText.push((100) + "%")
    
    
    
                    }
                    if (valueOpacity >= 0) {
                        cmdText.push("-extent")
                    }
                    if (user["blockList"][blockId].background_settings.crop != "left" && user["blockList"][blockId].background_settings.crop != "right") {
    
    
                        if (user["blockList"][blockId].type == "text" || user.isPreview) {
                            if (valueOpacity > 0) {
    
    
                                cmdText.push(user.iWidth + "x" + user.iHeight)
                                cmdText.push("-resize")
                                if (user["blockList"][blockId].type == "text" && !user.isPreview) {
    
                                    cmdText.push(user.iWidth + "x" + user.iHeight)
                                } else {
                                    cmdText.push(Config.previewWidth+"x" + (user["blockList"][blockId].lineslistheightMax / Config.hdHeight) * Config.previewHeight)
                                }
                            }
                        } else {
                            cmdText.push(user.iWidth + "x" + user["blockList"][blockId].lineslistheightMax)
                        }
                    } else {
                        if (user.isPreview) {
                            cmdText.push(user.iWidth / 2 + "x" + user.iHeight)
                            if (valueOpacity > 0) {
                                cmdText.push("-resize")
                                cmdText.push((Config.previewWidth / 2) + "x"+Config.previewHeight)
    
                            }
                        } else { cmdText.push(user.iWidth / 2 + "x" + user.iHeight) }
    
                    }
                    let format = "png"
                    let appendFormat = "PNG32:"
                    if (user["blockList"][blockId].type == "text") {
                        format = "jpg"
                        appendFormat = ""
                    }
    
                    if (valueOpacity >= 0) {
                        user["blockList"][blockId].increment++
                        cmdText.push(...resize_command, appendFormat + Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (blockId + 1) + path.sep + "fim-" + user["blockList"][blockId].increment.toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false }) + "." + format);
    
    
                    }
    
                    if (this.isDebug) {
                        if (this.which == -1)
                        this.add_command(id, 'convert', cmdText);
                        else if (this.which == blockId) {
                            this.add_command(id, 'convert', cmdText);
                        }
                    } else {
    
                        this.add_command(id, 'convert', cmdText);
    
                        //console.log(cmdText.join(' '))
    
    
    
    
                    }
                }
            }
    
    
    
    
    
    
            }
            let queue_reply = '';
        let queueName = this.queue;
        let tLimit = this.totalLimit;
        const onMessage = function (msg) {
            try {
                let data = JSON.parse(msg.content.toString())
                if (data.status == "error") {
                    let obj = new Object()
                    obj.socket =  Config.users[data.id].socket;
                    if (!isPreview)
                        obj.data = {
                            'status': 'error', videos_progress: { '360p': Config.users[data.id].p_360, '480p': Config.users[data.id].p_480, '720p': Config.users[data.id].p_720, '1080p': Config.users[data.id].p_1080 }
                            , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': 'none' }
                        }
                    else
                        obj.data = {
                            'status': 'error',
                            'is_preview': 'false'
                            , video_url: { url: 'none' }
                        }
                        Config.users[data.id].eventEmitter.emit('onProgress', obj);
                    return;
                }



                if (Config.users[data.id].totalVideos >= Config.users[data.id].processedVideos) {
                    if (Config.users[data.id].isPreview)
                        this.processHDVideo(Config.users, data.id)
                    else
                    this.processHDVideo(Config.users, data.id, Config.users[data.id].p_360, Config.users[data.id].p_480, Config.users[data.id].p_720, Config.users[data.id].p_1080)
}

            } catch (e) {
                throw (e)
            }
        }
        const queuefunction =function(err1, eq) {
            
            if (err1) {
                throw err1;
            }
            
            Config.ch.consume(eq.queue,onMessage.bind(this) , {noAck: true

            });

            let obj = new Object()
            obj.socket = user.socket;
            if (!isPreview)
                obj.data = {
                    'status': 'inprogress', videos_progress: { '360p': user.p_360, '480p': user.p_480, '720p': user.p_720, '1080p': user.p_1080 }
                    , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': 'none' }
                }
            else
                obj.data = {
                    'status': 'in_progress',
                    'is_preview': 'true'
                    , video_url: { url: 'none' }
                }
            user.eventEmitter.emit('onProgress', obj);
            let correlationId = Utils.generateUuid();
            let date = new Date()
            Config.ch.sendToQueue(queueName,
                Buffer.from(JSON.stringify({ tLimit: tLimit, commands: user.commands, id: id, date: date })), {
                correlationId: correlationId,
                replyTo: eq.queue, persistent: true
            }, function (e, r) {
                

            });

        }
            Config.ch.assertQueue('', {
                exclusive: true
            },queuefunction.bind(this))
        } catch (e) {
            console.log("err", e)
    
        }
      
}
processHDVideo = function(users, id, p_360 = null, p_480 = null, p_720 = null, p_1080 = null) {
    let isPreview = false
    let finalLine = "";
    let user = users[id];
    if (p_1080 == null) {
        isPreview = true;
        finalLine=this.makeCommand(true,id);
    } else {
        finalLine= this.makeCommand(false,id);
    }
    user.total_ms = user.total_sec * 1000;
    const { FFMpeg_Wrapper } = require('./ffmpeg_wrapper.js');
    const args = finalLine;
    const ffmpegProgress = new FFMpeg_Wrapper();
    const ffmpeg = require('child_process').spawn("ffmpeg", args);
    function logProgress(progressData) {
        let c_progress = (progressData.time_ms / user.total_ms)
        let p1080_progress = parseInt(parseFloat(c_progress / 1.0) * 100)
    
            let obj = new Object()
            obj.socket = user.socket
            if (isPreview) {

                obj.data = {
                    'status': 'in_progress',
                    'is_preview': 'true'
                    , video_url: { url: 'none' }
                }
            } else {

                obj.data = {
                    'status': 'inprogress',
                    videos_progress: { '360p': user.p_360, '480p': user.p_480, '720p': user.p_720, '1080p': p1080_progress }
                    , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': 'none' }
                }

            }
            user.eventEmitter.emit('onProgress', obj);  
    }
    ffmpeg.stderr.pipe(ffmpegProgress).on('data', logProgress);
    ffmpeg.on('close', code => {
        if (code) {
            let obj = new Object()
            obj.socket = user.socket
            if (!isPreview)
                obj.data = {
                    'status': 'error', videos_progress: { '360p': user.p_360, '480p': user.p_480, '720p': user.p_720, '1080p': user.p_1080 }
                    , videos_url: { '360p': 'none', '480p': 'none', '720p': 'none', '1080p': 'none' }
                }
            else
                obj.data = {
                    'status': 'error',
                    'is_preview': 'false'
                    , video_url: { url: 'none' }
                }
            user.eventEmitter.emit('onProgress', obj);

            console.error(`FFMPEG ERROR: ${ffmpegProgress.exitMessage}`);
        } else {
            if (!user.isPreview) {
                this.ffmpeg_run(user, Config.output_directory + path.sep + id + path.sep + "1080p.mp4", Config.output_directory + path.sep + id + path.sep, id)
            }
            let obj = new Object()
            obj.socket = user.socket
            if (isPreview) {
                obj.data = {
                    'status': 'completed',
                    'is_preview': 'true'
                    , video_url: { url: "http://" + Config.socket_ip + "/" + id + "/" + "270p.mp4" }
                }
                user.eventEmitter.emit('onProgress', obj);

                user.eventEmitter.removeAllListeners();
                users.splice(id, 1)
            }
            let endTime = new Date() - this.startTime
            fs.appendFile(Config.output_directory + id  +path.sep+ "time.txt", id + "--" + endTime.toString(), function (err) {
                if (err) throw err;
            console.log('Saved!');
            });


        }
    });

}
makeCommand = function(isPreview,id){
        let user = Config.users[id];
        user.total_sec = Math.ceil(user.total_sec)
        if (isPreview) {
            user.iWidth = Config.previewWidth;
            user.iHeight = Config.previewHeight;
        } else {
            user.iWidth = Config.hdWidth
            user.iHeight = Config.hdHeight
        }
        let imgType = "jpg"
        let finalAnswer = "";
        let addition = [];
        for (let i = 0; i < user["blockList"].length; i++) {
            if (user["blockList"][i].type == "logoImage") {
                addition.push("-thread_queue_size","512","-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fie-%04d.png");
                addition.push("-thread_queue_size","512","-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.png");
                addition.push("-thread_queue_size","512","-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "logo-%04d.png");
            }else if (user["blockList"][i].type == "logoText") {
                addition.push("-thread_queue_size","512","-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fiebg.jpg");
                addition.push("-thread_queue_size","512","-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.png");
                addition.push("-thread_queue_size","512","-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "logo-%04d.png");
              
            }else if (user["blockList"][i].type == "logoVideo") {
                
                addition.push("-thread_queue_size","512","-i", user["blockList"][i].url);
                addition.push("-thread_queue_size","512","-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.png");
                addition.push("-thread_queue_size","512","-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "logo-%04d.png");
             
            }else if (user["blockList"][i].type == "video" || user["blockList"][i].type == "quoteVideo") {
    
                if (user["blockList"][i].background_settings.crop == "left" || user["blockList"][i].background_settings.crop == "right") {
    
    
                    addition.push("-i", user["blockList"][i].url);
                    addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.png");
    
                } else {
    
                    addition.push("-i", user["blockList"][i].url);
                    addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.png");
    
    
                }
    
            } else if (user["blockList"][i].type == "text") {
                if (i == 0) {
    
                    addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.jpg");
    
    
                } else {
    
                    if (user["blockList"][i].background_settings.crop == "left" || user["blockList"][i].background_settings.crop == "right") {
                        addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.jpg");
                        addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fie-%04d.jpg");
    
                    } else {
    
                        addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.jpg");
    
    
                    }
                }
            }
            else if (user["blockList"][i].type == "photo" || user["blockList"][i].type == "quoteImage") {
                if (i == 0) {
                    addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fie-%04d."+imgType);
    
                    addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.png");
    
    
                } else {
                    if (user["blockList"][i].background_settings.crop == "left" || user["blockList"][i].background_settings.crop == "right") {
    
    
                        addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fie-%04d.jpg");
                        addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.png");
    
                    } else {
    
                        addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fie-%04d."+imgType);
                        addition.push("-framerate", "30", "-i", Config.output_directory + id +  path.sep +"data" +path.sep+ "frames" + (i + 1) + path.sep + "fim-%04d.png");
    
    
                    }
    
                }
            }
        }
    
    
    
        let check_first_index = false
        for (let i = 0; i < user["blockList"].length; i++) {
            if (user["blockList"][i].voice_over.exist) {
    
                addition.push("-i", user["blockList"][i].voice_over.local_source)
    
    
            }
    
        }
    
        if (this.global_data.local_src.length > 0) {
            if (this.global_data.loop) {
                 addition.push("-stream_loop", "-1");
            }
            addition.push("-i", this.global_data.local_src);
            if (this.global_data.isTrim) { 
                addition.push("-ss", this.global_data.trimValueStart, "-to", this.global_data.trimValueEnd)
            }
        }
        let lmS = 0;
        let f = 0
        let globalFilters = "brightness"
        let filter = ""
        if (globalFilters == "grayscale") {
            filter = ",format=gray"
        } else if (globalFilters == "brightness") {
            filter = ",eq=brightness=-0.01"
        }
        let delay_command = ""
        let enable_command = ""
        let currentTime = 0
        for (let i = 0; i < user["blockList"].length; i += 1) {
            if (i != 0) {
    
                f += parseFloat(user["blockList"][i - 1].timing)
                if (user.animation_style == "blankslate") {
                    delay_command = "PTS-STARTPTS+" + ((f - 1)) + "/TB"
                    enable_command = ":enable='between(t\," + ((f - 1.4)) + "," + user.total_sec + ")'"
                } else if (user.animation_style == "standout") 
               {
                    
                    delay_command = "PTS-STARTPTS+" + ((f - 1)) + "/TB"
                    enable_command = ":enable='between(t\," + ((f - 1.4)) + "," + user.total_sec + ")'"
                }else {
    
                    if (user["blockList"][i].type != "text") {
                        delay_command = "PTS-STARTPTS+" + (f + (0.5)) + "/TB"
    
                    } else {
                        delay_command = "PTS-STARTPTS+" + (f + (currentTime)) + "/TB"
                    }
                }
            } else {
                if (user.animation_style == "blankslate") {
                    delay_command = "PTS-STARTPTS"
    
                    enable_command = ""
                } else {
                    delay_command = "PTS-STARTPTS"
    
                }
            }
            let finalY = user["blockList"][i].linesListYAxis[0]
            if (user.animation_style == "blankslate") {
                finalY = 0
    
            }
            
            if (user["blockList"][i].type == "quoteImage" || user["blockList"][i].type == "quoteVideo" || user["blockList"][i].type == "text") {
                finalY = 0
            }
    
            if (i == 0) {
                if (user["blockList"][i].type == "text") {
    
                    if (user["blockList"][i].background_settings.crop == "left") {
    
                        finalAnswer += "[0:v][1:v]overlay=x=" + (user.iWidth / 2) + "[mv];";
                        finalAnswer += "[mv]pad=iw*2:0[left" + (lmS + 2) + "];[left" + (lmS + 2) + "][" + (lmS + 1) + ":v]overlay=x=960[out" + (i + 1) + "];";
                        lmS += 2;
                    } else if (user["blockList"][i].background_settings.crop == "right") {
    
                        finalAnswer += "[0:v][1:v]overlay=x=" + (user.iWidth / 2) + "[mv];";
                        finalAnswer += "[mv]pad=(iw/2)*2:0[left" + (lmS + 1) + "];[left" + (lmS + 1) + "][" + (lmS + 2) + ":v]overlay=x=" + (user.iWidth / 2) + "[out" + (i + 1) + "];";
    
                        lmS += 2;
                    } else {
    
                        lmS += 1;
    
                        finalAnswer += "[0:v][1:v]overlay=y=" + finalY + "[out1];";
                    }
                }else if(user["blockList"][i].type == "logoText"){
                    finalAnswer += "[0:v][1:v]overlay[mv];";
                    finalAnswer += "[mv][" + (lmS + 2) + ":v]overlay=(main_w-overlay_w)/2:H-h-"+ ((50/ Config.hdHeight)*user.iHeight )+"[outelogo1];";
                    finalAnswer += "[outelogo1][" + (lmS + 3) + ":v]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2[out1];";
                    lmS += 3
                }else if(user["blockList"][i].type == "logoImage"){
                    finalAnswer += "[0:v][1:v]overlay[mv];";
                    finalAnswer += "[mv][" + (lmS + 2) + ":v]overlay=(main_w-overlay_w)/2:H-h-"+ ((50/ Config.hdHeight)*user.iHeight ) +"[outelogo1];";
                    finalAnswer += "[outelogo1][" + (lmS + 3) + ":v]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2[out1];";
                    lmS += 3
                }else if(user["blockList"][i].type == "logoVideo"){
                    finalAnswer += "[0:v][1:v]overlay[mv];";
                    finalAnswer += "[mv][" + (lmS + 2) + ":v]overlay=(main_w-overlay_w)/2:H-h-"+ ((50/ Config.hdHeight)*user.iHeight ) +"[outelogo1];";
                    finalAnswer += "[outelogo1][" + (lmS + 3) + ":v]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2[out1];";
                    lmS += 3
                 } else if (user["blockList"][i].type == "photo" || user["blockList"][i].type == "quoteImage") {
                        if (user["blockList"][i].background_settings.crop == "left" || user["blockList"][i].background_settings.crop == "right") {
                            if (user["blockList"][i].background_settings.crop == "left") {
    
                                finalAnswer += "[0:v][1:v]overlay=x=0[mv];";
                                finalAnswer += "[mv][" + (lmS + 2) + ":v]overlay=x=" + (user.iWidth / 2) + "[out1];";
                              
                            } else {
                                finalAnswer += "[0:v][" + (lmS + 2) + ":v]overlay=x=0[mv];";
                                finalAnswer += "[mv][1:v]overlay=x=" + (user.iWidth / 2) + "[out1];";
    
                            }
                            lmS += 2
                        } else {
                            finalAnswer += "[0:v][1:v]overlay[mv];";
                            finalAnswer += "[" + (lmS + 2) + ":v]setpts=" + delay_command + "[outjm" + (i + 1) + "];";
                            finalAnswer += "[mv][outjm" + (i + 1) + "]overlay=x=" + 0 + ":y=" + finalY + enable_command + "[out1];"
                            lmS += 2;
                        }
    
    
    
    
    
                    } else if (user["blockList"][i].type == "video") {
    
                        if (user["blockList"][i].background_settings.crop == "left") {
                            finalAnswer += "[0:v][1:v]overlay=x=0[mv];";
                            finalAnswer += "[mv][" + (lmS + 2) + ":v]overlay=x=" + (user.iWidth / 2) + "[out" + (i + 1) + "];";
    
                        } else if (user["blockList"][i].background_settings.crop == "right") {
                            finalAnswer += "[0:v][1:v]overlay=x=0[mv];";
                            finalAnswer += "[mv]pad=(iw/2)*2:0[left" + (lmS + 1) + "];[left" + (lmS + 1) + "][" + (lmS + 2) + ":v]overlay=x=" + (user.iWidth / 2) + "[out" + (i + 1) + "];";
                        } else {
                            finalAnswer += "[0:v][1:v]overlay[mv];";
                            finalAnswer += "[" + (lmS + 2) + ":v]setpts=" + delay_command + "[outjm" + (i + 1) + "];";
                            finalAnswer += "[mv][outjm" + (i + 1) + "]overlay=x=0:y=" + finalY + enable_command + "[out1];";
                        }
    
                        lmS += 2;
                    }else if(user["blockList"][i].type == "logoVideo"){
                        
                        finalAnswer += "[" + (lmS + 1) + ":v]setpts=" + delay_command + "[outjm" + (i + 2) + "];";
                        finalAnswer += "[" + (lmS + 2) + ":v]setpts=PTS-STARTPTS+" + (f) + "/TB[outjm" + (i + 1) + "];";
                        finalAnswer += "[" + (lmS + 3) + ":v]setpts=PTS-STARTPTS[outlogotext"+(i+1)+"];";
                        finalAnswer += "[outjm" + (i + 2) + "][outjm" + (i + 1) + "]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2"+ enable_command + "[outjmlogovideo" + (i + 1) + "];";
                        finalAnswer += "[outjmlogovideo" + (i + 1) + "][outlogotext" + (i + 1) + "]overlay=(main_w-overlay_w)/2:H-h-"+ ((200/ Config.hdHeight)*user.iHeight ) + enable_command + "[out" + (i + 1) + "];";
                        lmS+=3;
        
                    }
    
            } else if (user["blockList"][i].type == "video" || user["blockList"][i].type == "quoteVideo") {
                let cropped = 0
                if (user["blockList"][i].background_settings.crop == "right") {
                    cropped = user.iWidth + ":" + user.iHeight + ":" + (user.iWidth / 3) + ":0,pad=" + user.iWidth / 2 + "*2:0"
                    finalAnswer += "[" + (lmS + 2) + ":v]crop=" + cropped + "[left" + (lmS + 2) + "];[left" + (lmS + 2) + "][" + (lmS + 1) + ":v]overlay=x=" + user.iWidth / 2 + "[out" + (i + 1) + "];";
                    
                } else if (user["blockList"][i].background_settings.crop == "left") {
                    cropped = (user.iWidth / 2) + ":" + user.iHeight + ":" + (user.iWidth / 3) + ":0,pad=" + user.iWidth / 2 + "*2:0"
    
                    finalAnswer += "[" + (lmS + 1) + ":v]crop=" + cropped + "[left" + (lmS + 1) + "];[left" + (lmS + 1) + "][" + (lmS + 2) + ":v]overlay=x=" + user.iWidth / 2 + "[out" + (i + 1) + "];";
                    
                } else {
                    finalAnswer += "[" + (lmS + 1) + ":v]setpts=" + delay_command + "[outjm" + (i + 2) + "];";
    
                    finalAnswer += "[" + (lmS + 2) + ":v]setpts=PTS-STARTPTS+" + (f) + "/TB[outjm" + (i + 1) + "];";
    
                    finalAnswer += "[outjm" + (i + 2) + "][outjm" + (i + 1) + "]overlay=x=" + 0 + ":y=" + finalY + enable_command + "[out" + (i + 1) + "];";
                    //finalAnswer += "[oust" + (i + 1) + "][outsub" + (i + 1) + "]overlay=x=" + 0 + ":y=" + ( finalY+offsetFFMPEGY) + "[out" + (i + 1) + "];";
    
    
    
                }
    
    
                lmS += 2;
    
            }  else if(user["blockList"][i].type == "logoImage"){
                finalAnswer += "[" + (lmS + 1) + ":v]setpts=" + delay_command + "[outjm" + (i + 2) + "];";
    
                finalAnswer += "[" + (lmS + 2) + ":v]setpts=PTS-STARTPTS+" + (f) + "/TB[outjm" + (i + 1) + "];";
                finalAnswer += "[" + (lmS + 3) + ":v]setpts=PTS-STARTPTS[outlogotext"+(i+1)+"];";
    
                        
                
                finalAnswer += "[outjm" + (i + 2) + "][outjm" + (i + 1) + "]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2"+ enable_command + "[outlogovideo" + (i + 1) + "];";
                finalAnswer += "[outjmlogovideo" + (i + 1) + "][outlogotext" + (i + 1) + "]overlay=(main_w-overlay_w)/2:H-h-"+ ((200/ Config.hdHeight)*user.iHeight ) + enable_command + "[out" + (i + 1) + "];";
                lmS+=3;
            }  else if(user["blockList"][i].type == "logoText"){
                finalAnswer += "[" + (lmS + 1) + ":v]setpts=" + delay_command + "[outjm" + (i + 2) + "];";
                finalAnswer += "[" + (lmS + 2) + ":v]setpts=PTS-STARTPTS+" + (f) + "/TB[outjm" + (i + 1) + "];";
                finalAnswer += "[" + (lmS + 3) + ":v]setpts=PTS-STARTPTS[outlogotext"+(i+1)+"];";
                finalAnswer += "[outjm" + (i + 2) + "][outjm" + (i + 1) + "]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2"+ enable_command + "[outlogovideo" + (i + 1) + "];";
                finalAnswer += "[outjmlogovideo" + (i + 1) + "][outlogotext" + (i + 1) + "]overlay=(main_w-overlay_w)/2:H-h-"+ ((200/ Config.hdHeight)*user.iHeight ) + enable_command + "[out" + (i + 1) + "];";
                lmS+=3;
            }  else {
                let cropped = 0;
                if (user["blockList"][i].background_settings.crop == "left" || user["blockList"][i].background_settings.crop == "right") {
                    
                    if (user["blockList"][i].background_settings.crop == "left") {
                        cropped = 0;
                        finalAnswer += "[" + (lmS + 1) + ":v][" + (lmS + 2) + ":v]hstack=inputs=2[out" + (i + 1) + "];";
                    } else {
                        cropped = (user.iWidth / 2)
                        finalAnswer += "[" + (lmS + 2) + ":v][" + (lmS + 1) + ":v]hstack=inputs=2[out" + (i + 1) + "];";
                    }
                    lmS += 2;
                } else {
                    if (user["blockList"][i].type != "text") {
                        finalAnswer += "[" + (lmS + 1) + ":v]setpts=" + delay_command + "[outdes" + (i + 1) + "];";
                        finalAnswer += "[" + (lmS + 2) + ":v]setpts=PTS-STARTPTS+" + (f) + "/TB[outjes" + (i + 1) + "];";
                        finalAnswer += "[outdes" + (i + 1) + "][outjes" + (i + 1) + "]overlay=y=" + finalY + enable_command + "[outes" + (i + 1) + "];"
                    } else {
                        finalAnswer += "[" + (lmS + 1) + ":v]setpts=PTS-STARTPTS+" + (f) + "/TB[outes" + (i + 1) + "];";
                    }
    
    
                    if (user["blockList"][i].type == "text") { lmS += 1 } else { lmS += 2 }
    
    
    
                }
                ;
            }
    
        }
        let format = "outse"; f = 0;
        for (let i = 0; i < user["blockList"].length; i++) {
            if (i != 0) {
                f += (user["blockList"][i - 1].timing)
            }
            if (user["blockList"][i].voice_over.exist) {
                format = "outse"
    
                user.current_audio_index++
            }
            else {
                format = "oute"
            }
            if (i == 0) {
                finalAnswer += "[out1]setpts=PTS-STARTPTS" + filter + "[oute1];";
            }
            else
                if (user["blockList"][i].type == "text") {
                   
                    if (user["blockList"][i].background_settings.crop == "left" || user["blockList"][i].background_settings.crop == "right") {
                        finalAnswer += "[out" + (i + 1) + "]setpts=PTS-STARTPTS+" + f + "/TB" + filter + "[" + format + (i + 1) + "];";
                    } else {
                        finalAnswer += "[outes" + (i + 1) + "]" + filter.substr(1, filter.length - 1) + "[" + format + (i + 1) + "];";
                    }
    
                } else if (user["blockList"][i].type == "photo" || user["blockList"][i].type == "quoteImage") {
    
                    if (user["blockList"][i].background_settings.crop == "left" || user["blockList"][i].background_settings.crop == "right") {
                       finalAnswer += "[out" + (i + 1) + "]setpts=PTS-STARTPTS+" + (f + currentTime) + "/TB" + filter + "[" + format + (i + 1) + "];";
                    } else {
                        finalAnswer += "[outes" + (i + 1) + "]" + filter.substr(1, filter.length - 1) + "[" + format + (i + 1) + "];";
                    }
    
                } else if (user["blockList"][i].type == "video" ||user["blockList"][i].type == "logoText" ||user["blockList"][i].type == "logoImage" ||user["blockList"][i].type == "logoVideo" || user["blockList"][i].type == "quoteVideo") {
                    
                    finalAnswer += "[out" + (i + 1) + "]setpts=PTS-STARTPTS+" + f + "/TB" + filter + "[" + format + (i + 1) + "];";
    
                }
            }
    
        for (let i = 0; i < user["blockList"].length; i++) {
            if (user["blockList"][i].voice_over.exist) {
                if (!check_first_index) {
                    user.current_audio_index = lmS;
                    check_first_index = true;
                }
                addition.push("-i", user["blockList"][i].voice_over.local_source);
                lmS++;
    
            }
    
        }
        for (let i = 0; i < user["blockList"].length; i++) {
            if (user["blockList"][i].voice_over.exist) {
                finalAnswer += "[outse" + (i + 1) + ":a][" + user.current_audio_index + ":a]amerge=inputs=2" + "[oute" + (i + 1) + "]";
                user.current_audio_index++;
            }
        }
        let lastP = "[oute1]";
        let nextParam = "oute";
        let currentParam = "oute";
        f = 0;
        for (let ie = 1; ie <= user["blockList"].length; ie++) {
            let i = ie - 1;
            f += (user["blockList"][i].timing);
            if (i == 0) {
                nextParam = "outnje";
    
            }
            if (i >= 1) {
                currentParam = "outnje";
            }
            
                if (i == user["blockList"].length - 2) {
                    if (user["blockList"].length == 2) {
                        nextParam = "oute"
                    }
    
                    if (user["blockList"][i].type == "video"||user["blockList"][i].type == "logoText" ||
                    user["blockList"][i].type == "logoVideo" ||
                    user["blockList"][i].type == "logoImage" 
                 || user["blockList"][i].type == "photo" || user["blockList"][i].type == "text" || user["blockList"][i].type == "quoteVideo" || user["blockList"][i].type == "quoteImage") {
    
                        if (user.animation_style == "blankslate") {
    
                            finalAnswer += "[" + nextParam + (i + 1) + "]format=rgba,fade=t=out:st=" + f + ":d=" + 2 + ":alpha=1[a" + nextParam + (i + 1) + "];";
                            finalAnswer += "[oute" + (i + 2) + "]format=rgba,fade=t=in:st=" + f + ":d=" + 2 + ":alpha=1[aoute" + (i + 2) + "];"
                            finalAnswer += "[a" + nextParam + (i + 1) + "][aoute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")':y=0:x=0[outnjse" + (i + 1) + "];";
    
                        } else {
                            finalAnswer += "[" + nextParam + (i + 1) + "][oute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")':y=0:x=0[outnjse" + (i + 1) + "];";
                        }
                    } else {
                        finalAnswer += "[" + nextParam + (i + 1) + "][oute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'[outnjse" + (i + 1) + "];";
    
                    }
                    lastP = "[outnjse" + (i + 1) + "]";
    
    
                } else if(i !=user["blockList"].length - 1) {
                    if (user["blockList"][i].type == "video"|| user["blockList"][i].type == "quoteVideo"||user["blockList"][i].type == "logoText" ||
                    user["blockList"][i].type == "logoVideo" ||
                    user["blockList"][i].type == "logoImage"  || user["blockList"][i].type == "quoteVideo") {
    
    
    
    
                        if (user["blockList"].length - 1 >= i + 1) {
    
                            if (user["blockList"][i + 1].type == "video"|| user["blockList"][i].type == "quoteVideo"||user["blockList"][i].type == "logoText" ||
                            user["blockList"][i].type == "logoVideo" ||
                            user["blockList"][i].type == "logoImage"  || user["blockList"][i].type == "quoteVideo" || user["blockList"][i].type == "quoteImage" || user["blockList"][i + 1].type == "photo" || user["blockList"][i + 1].type == "text") {
                                let overLayY = ":y=0:x=0"
                                if (user["blockList"][i + 1].type == "photo") {
                                    overLayY = ""
    
                                }
                                if (user.animation_style == "blankslate") {
    
                                    finalAnswer += "[" + currentParam + (i + 1) + "]format=rgba,fade=t=out:st=" + f + ":d=" + 2 + ":alpha=1[a" + currentParam + (i + 1) + "]";
                                    finalAnswer += ";[oute" + (i + 2) + "]format=rgba,fade=t=out:st=" + f + ":d=" + 2 + ":alpha=1[aoute" + (i + 2) + "];"
                                    finalAnswer += "[a" + currentParam + (i + 1) + "][aoute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
    
                                } else {
                                    finalAnswer += "[" + currentParam + (i + 1) + "][oute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
                                }
                                lastP = "[outnje" + (i + 2) + "]";
    
                            }
                        } else {
                            let overLayY = ":y=0:x=0"
                            finalAnswer += "[oute" + (i + 1) + "][oute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
                            lastP = "[outnje" + (i + 2) + "]";
                            //  console.log(lastP)
                        }
                        // finalAnswer += "["+nextParam + (i+1) + "][oute" + (i + 2) + "]overlay=enable='between(t\\,"+f +","+(user .total_sec)+")':y='if(gte(t,"+f +"),if(gte(h-(t-"+f +")*(1/0.5)*h,0),h-(t-"+f +")*(1/0.5)*h,0))':x=0["+nextParam + (i + 2) + "];";
                        //lastP = "[outnje" + (i + 2) + "]";
                    } else if (user["blockList"][i].type == "photo" || user["blockList"][i].type == "quoteImage") {
                        if (user["blockList"].length - 1 >= i + 1) {
                            if (user["blockList"][i + 1].type == "video" || user["blockList"][i].type == "quoteVideo" || user["blockList"][i].type == "quoteImage" || user["blockList"][i + 1].type == "photo" || user["blockList"][i + 1].type == "text") {
                                let overLayY = ":y=0:x=0"
                                if (user["blockList"][i + 1].type == "photo" || user["blockList"][i].type == "quoteImage") {
                                    overLayY = ""
    
                                }
    
                                if (user.animation_style == "blankslate") {
    
                                    finalAnswer += "[" + currentParam + (i + 1) + "]format=rgba,fade=t=out:st=" + f + ":d=" + 2 + ":alpha=1[a" + currentParam + (i + 1) + "]";
                                    finalAnswer += ";[oute" + (i + 2) + "]format=rgba,fade=t=in:st=" + f + ":d=" + 2 + ":alpha=1[aoute" + (i + 2) + "];"
                                    finalAnswer += "[a" + currentParam + (i + 1) + "][aoute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
    
                                } else {
                                    finalAnswer += "[" + currentParam + (i + 1) + "][oute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
                                }
    
                                lastP = "[outnje" + (i + 2) + "]";
    
                            }
                        } else {
                            if (user["blockList"][i].type == "photo" || user["blockList"][i].type == "quoteImage") {
                                overLayY = ""
    
                            }
    
                            if (user.animation_style == "blankslate") {
    
                                finalAnswer += "[" + currentParam + (i + 1) + "]format=rgba,fade=t=out:st=" + f + ":d=" + 2 + ":alpha=1[a" + currentParam + (i + 1) + "]";
                                finalAnswer += ";[oute" + (i + 2) + "]format=rgba,fade=t=in:st=" + f + ":d=" + 2 + ":alpha=1[aoute" + (i + 2) + "];"
                                finalAnswer += "[a" + currentParam + (i + 1) + "][aoute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
    
                            } else {
                                finalAnswer += "[" + currentParam + (i + 1) + "][oute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
                            }
                            lastP = "[outnje" + (i + 2) + "]";
    
                        }
    
    
                    } else if (user["blockList"][i].type == "text") {
                        if (user["blockList"].length - 1 >= i + 1) {
                            if (user["blockList"][i + 1].type == "video" || user["blockList"][i].type == "quoteVideo" || user["blockList"][i].type == "quoteImage" || user["blockList"][i + 1].type == "photo" || user["blockList"][i + 1].type == "text") {
                                let overLayY = ":y=0:x=0"
                                if (user["blockList"][i + 1].type == "photo" || user["blockList"][i].type == "quoteImage") {
                                    overLayY = ""
    
                                }
    
                                finalAnswer += "[" + currentParam + (i + 1) + "][oute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
                                lastP = "[outnje" + (i + 2) + "]";
    
                            }
                        } else {
                            if (user["blockList"][i].type == "photo" || user["blockList"][i].type == "quoteImage") {
                                overLayY = ""
    
                            }
    
    
                            if (user.animation_style == "blankslate") {
    
                                finalAnswer += "[oute" + (i + 1) + "]format=rgba,fade=t=out:st=" + f + ":d=" + 2 + ":alpha=1[aoute" + (i + 1) + "]";
                                finalAnswer += ";[oute" + (i + 2) + "]format=rgba,fade=t=in:st=" + f + ":d=" + 2 + ":alpha=1[aoute" + (i + 2) + "];"
                                finalAnswer += "[aoute" + (i + 1) + "][aoute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
    
                            } else {
                                finalAnswer += "[oute" + (i + 1) + "][oute" + (i + 2) + "]overlay=enable='between(t\\," + f + "," + (user.total_sec) + ")'" + overLayY + "[" + nextParam + (i + 2) + "];";
                            }
    
                            lastP = "[outnje" + (i + 2) + "]";
                        }
    
    
                    }
    
                }
        }
        let ap = []
        if (this.global_data.source.length > 0) {
             ap.push("-map", (lmS + 1) + ":a")
        }
        let finalLine = ["-y", "-r", "30", "-f", "lavfi", "-i", "color=black:s=" + user.iWidth + "x" + user.iHeight]
        finalLine.push(...addition);
        let fileName = "1080p";
        if (isPreview)
            fileName = "270p";
        globalFilters = "yuv444p";
        finalLine.push("-filter_complex", finalAnswer.substr(0, finalAnswer.length - 1), "-map", lastP, ...ap, "-t", user.total_sec, "-profile:v", "baseline", "-level", "3.0", "-movflags", "+faststart", "-pix_fmt", "yuv420p", Config.output_directory +  path.sep+ id + path.sep + fileName + ".mp4");
        return finalLine;
}
}
module.exports=AnimBulletin;