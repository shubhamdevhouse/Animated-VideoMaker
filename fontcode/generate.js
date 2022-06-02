const fs = require('fs');
const process = require( 'process' );
const argv = key => {
    if ( process.argv.includes( `--${ key }` ) ) return true;
    const value = process.argv.find( element => element.startsWith( `--${ key }=` ) );
    if ( !value ) return null;
    return value.replace( `--${ key }=` , '' );
}
if(argv('font')==null){
    console.error("No font file found!");
    process.exit(1);
}
if(argv('output')==null){
    console.error("No output file name found!");
    process.exit(1);  
}

const { createCanvas, registerFont } = require('canvas');
//'../assets/Font/Roboto-Bold.ttf'
registerFont(argv('font'), { family: 'Font' })
let fontString = "~!@#$%^&*()-_+={}][|\`,./?;:'\"<>1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ";
let fontData = {};
const canvas = createCanvas(100, 100)
const ctx = canvas.getContext('2d')
ctx.font = '500px Font';

for(let i=0;i<fontString.length;i++){
    let char = fontString[i];
    let text = ctx.measureText(char);
    fontData[char] = {};
    fontData[char].baseLine = text.alphabeticBaseline;
    fontData[char].width= text.width,
    fontData[char].ascent = text.actualBoundingBoxAscent;
    fontData[char].descent = text.actualBoundingBoxDescent;
}
fs.writeFile(argv('output'),JSON.stringify(fontData),(err)=>{
console.error(err);
});