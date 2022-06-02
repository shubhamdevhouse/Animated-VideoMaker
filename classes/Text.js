
const fs = require('fs');
class Text {

    constructor(metricFile, fontSize = 50, defaultFontsize = 500) {
        this.fontSize = fontSize;
        this.defaultFontSize = defaultFontsize;
        this.text = "";
        this.lines = [];
        let self = this;
        fs.readFile(metricFile, { encoding: 'utf-8' }, function (err, data) {
            if (!err) {
                self.fontMetrics = JSON.parse(data);
            } else {
                console.log(err);
            }
        });
    }
    getMaxWidth = () => {
        return this.maxWidth;
    }
    setMaxWidth = (value) => {
        this.maxWidth = value;
    }
    getDefaultFontSize = () => {
        return this.defaultFontsize;
    }
    setDefaultFontSize = (value) => {
        this.defaultFontsize = value;
    }
    getFontSize = () => {
        return this.fontSize;
    }
    setFontSize = (value) => {
        this.fontSize = value;
    }
    getText = () => {
        return this.text;
    }

    setText = (value) => {
        this.text = value;
    }

    getMetricData = (word) => {
        let width = 0;
        let ascent = 0;
        let descent = 0;

        for (let i = 0; i < word.length; i++) {
            let charMetric = this.fontMetrics[word[i]];
            width += Math.round((charMetric.width / this.getDefaultFontSize()) * this.getFontSize());
            let optimizedAscent = Math.round((charMetric.ascent / this.getDefaultFontSize()) * this.getFontSize());
            let optimizedDescent = Math.round((charMetric.descent / this.getDefaultFontSize()) * this.getFontSize());
            if (optimizedAscent > ascent) {
                ascent = optimizedAscent;
            }
            if (optimizedDescent > descent) {
                descent = optimizedDescent;
            }


        }
        let metricObject = { width, ascent, descent };
        return metricObject;
    }
    validateWord = (splitted, word, index) => {
        let wordWidth = 0;
        if (index >= splitted.length) { return; }
        for (let i = 0; i < word.length; i++) {
            let charWidth = Math.round((this.fontMetrics[word[i]].width / this.getDefaultFontSize()) * this.getFontSize());
            if (wordWidth + charWidth >= this.getMaxWidth()) {
                let tempWord = word.substr(0, i);
                let restWord = word.substr(i);
                splitted.splice(index + 1, 0, restWord);
                splitted[index] = tempWord;
                break;
            } else { wordWidth += charWidth; }
        }
        this.validateWord(splitted, splitted[index + 1], index + 1);

    }

    getLine = (splitted, text, textWidth, index, oldMetricObj) => {
        let metricObj = this.getMetricData(splitted[index]);

        let wordWidth = metricObj.width;
        console.log(metricObj, "dataMetric");
        if (textWidth + wordWidth > this.getMaxWidth()) {

            let textSplit = text.split(" ");
            textSplit.pop();

            let textString = textSplit.join(" ");
            let widthWithSpace = textWidth + (textSplit.length * ((this.fontMetrics[" "].width / this.getDefaultFontSize()) * this.getFontSize()));
            console.log({ width: widthWithSpace, text: textString, ascent: oldMetricObj.ascent, descent: oldMetricObj.descent }, "NewLine");

            this.lines.push({ width: widthWithSpace, text: textString, ascent: oldMetricObj.ascent, descent: oldMetricObj.descent });
            return this.getLine(splitted, splitted[index], 0, index, metricObj);

        } else {
            if (index + 1 >= splitted.length) {

                let widthWithSpace = (wordWidth + textWidth) + ((text.split(" ").length - 1) * ((this.fontMetrics[" "].width / this.getDefaultFontSize()) * this.getFontSize()));
                console.log(wordWidth, textWidth, text, this.fontMetrics[" "].width);
                console.log({ width: widthWithSpace, text, ascent: metricObj.ascent, descent: metricObj.descent }, "NewLine");
                this.lines.push({ width: widthWithSpace, text, ascent: metricObj.ascent, descent: metricObj.descent });
                console.log(this.lines);
                return this.lines;
            }
            
            if (oldMetricObj.width > metricObj.width)
                metricObj.width = oldMetricObj.width

            if (oldMetricObj.ascent > metricObj.ascent)
                metricObj.ascent = oldMetricObj.ascent

            if (oldMetricObj.descent > metricObj.descent)
                metricObj.descent = oldMetricObj.descent
            
            return this.getLine(splitted, text + " " + splitted[index + 1], textWidth + wordWidth, index + 1, metricObj);
        }
    }

    generateText = (text, width, fontSize, defaultFontSize = 500) => {
        this.lines = [];
        this.setFontSize(fontSize);
        this.setMaxWidth(width);
        this.setDefaultFontSize(defaultFontSize);
        let splittedText = text.split(" ");
        this.validateWord(splittedText, splittedText[0], 0);
        return this.getLine(splittedText, splittedText[0], 0,0,{ width:0, ascent:0, descent:0 });
    }




}
module.exports = Text;