/*!
 * CandleStickChart.js
 * Copyright 2013 Ami Heines
 * Released under the MIT license
 */
window.Candlestick = function (canvasID, rawData, options) {
  // utility finctions
  this.Max = function Max(array) { return Math.max.apply(Math, array); }
  this.Min = function Min(array) { return Math.min.apply(Math, array); }

  var chart = this;
  var ctx = document.getElementById(canvasID).getContext("2d");
  var oCandle = convertYahooFinanceCsvToCandles(rawData,options);//csvデータを変換する

  var d = oCandle.d
    , o = oCandle.o
    , h = oCandle.h
    , l = oCandle.l
    , c = oCandle.c
    , v = oCandle.v;
  var fig = {
    width: ctx.canvas.width,
    height: ctx.canvas.height,
    pixelsPerCandle: 4,
    marginTop: 8,
    marginBottom: 200,
    marginLeft: 5,
    marginRight: 23,
    liMarginTop: 0,
    liMarginBottom: 0,
    lihh: 0,
    lill: 0,
    hh: 0,
    ll: 0
  };
  fig.hh = this.Max(h.slice(0, Math.min(h.length, (fig.width - fig.marginLeft - fig.marginRight) / fig.pixelsPerCandle)));
  fig.ll = this.Min(l.slice(0, Math.min(l.length, (fig.width - fig.marginLeft - fig.marginRight) / fig.pixelsPerCandle)));

  if (window.devicePixelRatio) {
    ctx.canvas.style.width = fig.width + "px";
    ctx.canvas.style.height = fig.height + "px";
    ctx.canvas.height = fig.height * window.devicePixelRatio;
    ctx.canvas.width = fig.width * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  ctx.translate(0.5, 0.5);

  // improve hh, ll
  var range = fig.hh - fig.ll;//高さのレンジ
  var step = 1;
  //メモリ
  while (range / step > 16) {
    if (step < 4) {
      step++;
    } else if (step < 9) {
      step += 2;
    } else if (step < 30) {
      step += 5;
    } else {
      step += 10;
    }
  }

  fig.ll = step * Math.floor(fig.ll / step);//数値以下の最大の整数を返します
  fig.hh = step * Math.ceil(fig.hh / step);//数値以上の最小の整数を返します

  var upperIndicators = new Array();
  var lowerIndicator = {};
  for (var key in options.indicators) {
    var indicator = options.indicators[key];
    //console.log(indicator);
    if (indicator[0] == 'SMA') {
      upperIndicators.push({
        arr: SMA(oCandle[indicator[1]], indicator[2])
        , label: 'SMA(' + indicator[1] + ',' + indicator[2] + ')'
      });
    } else if (indicator[0] == 'EMA') {
      upperIndicators.push({
        arr: EMA(oCandle[indicator[1]], indicator[2])
        , label: 'EMA(' + indicator[1] + ',' + indicator[2] + ')'
      });
    } else if (indicator[0] == 'RSI') {
      lowerIndicator.label = 'RSI(' + indicator[1] + ',' + indicator[2] + '+' + indicator[3] + '+' + indicator[4] + '+' + indicator[5] + '+' + indicator[6] + ')';
      lowerIndicator.data = RSI(oCandle[indicator[1]], indicator[2], indicator[3], indicator[4], indicator[5], indicator[6]);
    }
  }

  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = "rgba(200,250,200, .5)";
  fig.liMarginTop = fig.height - fig.marginBottom + 10;// li===LowerIndicator
  fig.liMarginBottom = 10;
  ctx.fillRect(fig.marginLeft, fig.liMarginTop, fig.width - fig.marginLeft - fig.marginRight, fig.marginBottom - 20);

  var li = lowerIndicator.data;
  fig.lihh = this.Max(li.rsi.slice(0, Math.min(li.rsi.length, (fig.width - fig.marginLeft - fig.marginRight) / fig.pixelsPerCandle)));
  fig.lill = this.Min(li.rsi.slice(0, Math.min(li.rsi.length, (fig.width - fig.marginLeft - fig.marginRight) / fig.pixelsPerCandle)));

  //ラベル
  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'black';
  leftPos = fig.marginLeft + 5;
  ctx.fillText(lowerIndicator.label, leftPos, fig.liMarginTop + 5);
  metrics = ctx.measureText(lowerIndicator.label);
  leftPos += metrics.width + 5;
  ctx.stroke();

  //chart
  DrawPanel(ctx,fig, oCandle);
  DrawCurve(fig, li.rsi, "black", "rsi");
  DrawCurve(fig, li.rsimov, "rsimov", "red");
  DrawReal(fig, li.buf1, "buf1", "blue");
  DrawReal(fig, li.buf2, "buf2", "red");
  DrawPredict(fig, li.buf3, "buf3", "blue");
  DrawPredict(fig, li.buf4, "buf4", "red");
  DrawCircle(fig, li.buf5, "buf5", "blue");
  DrawCircle(fig, li.buf6, "buf6", "red");
  DrawCandle(fig, oCandle);
  upperIndicators.push(lowerIndicator);
  this.data = [oCandle, upperIndicators];
}

// misc functions
function scale(ll, hh, height, marginTop, marginBottom, y) {
  return marginTop + (height - marginTop - marginBottom) * (1 - (y - ll) / (hh - ll));
}

function calcyPrev(fig, value) {
  return scale(fig.lill, fig.lihh, fig.height, fig.liMarginTop, fig.liMarginBottom, value);
}

function calcx0(fig, i) {
  return (fig.width - fig.marginRight) - (i + 1) * fig.pixelsPerCandle;
}

function DrawPanel(ctx,fig, data) {
  ctx.fillStyle = "rgb(240,240,220)";//pale yellow
  ctx.fillRect(0, 0, fig.width - 1, fig.height - 1);
  ctx.fillStyle = "rgb(250,250,200)";//pale yellow
  ctx.fillRect(fig.marginLeft, fig.marginTop, fig.width - fig.marginLeft - fig.marginRight, fig.height - fig.marginTop - fig.marginBottom);

  for (var i = fig.ll; i <= fig.hh; i += fig.step) {
    var y0 = calcyPrev(fig, i);
    ctx.moveTo(fig.marginLeft, y0);
    ctx.lineTo(fig.width - fig.marginRight, y0);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.fillText(i, fig.width - fig.marginRight + 2, y0);
  }
  ctx.strokeStyle = 'rgb(200,200,150)';
  ctx.stroke();

  // X coordinate - month ticks (for weekly charts, for daily chart use 3 letter for each month)
  ctx.beginPath();
  var y0 = calcyPrev(fig, fig.ll);
  var y1 = calcyPrev(fig, fig.ll);
  for (var i = 0; i < data.d.length - 1 && i < (fig.width - fig.marginLeft - fig.marginRight - fig.pixelsPerCandle) / fig.pixelsPerCandle; i++) {
    if (data.d[i].getMonth() != data.d[i + 1].getMonth()) {
      var x0 = calcx0(fig, i) - 1;
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y1);
      mm = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C'][data.d[i].getMonth()];
      if (data.d[i].getMonth() == 0) {
        mm = ('' + data.d[i].getFullYear()).substr(2, 2);
      }
      ctx.textBaseline = 'top';
      var metrics = ctx.measureText(mm);
      ctx.fillText(mm, x0 - metrics.width / 2, y0);
    }
  }

  ctx.strokeStyle = 'rgb(200,200,150)';
  ctx.stroke();

  for (var j = 0; j < upperIndicators.length; j++) {
    var upperIndicator = upperIndicators[j];
    var yPrev = scale(fig.ll, fig.hh, fig.height, fig.marginTop, fig.marginBottom, upperIndicator.arr[0]), x0 = calcx0(fig);
    ctx.beginPath();// the upperIndicators line
    ctx.moveTo(x0 + 1, yPrev);
    for (var i = 1; i < c.length && i < (fig.width - fig.marginLeft - fig.marginRight - fig.pixelsPerCandle) / fig.pixelsPerCandle; i++) {
      var yCurr = scale(fig.ll, fig.hh, fig.height, fig.marginTop, fig.marginBottom, upperIndicator.arr[i]);
      x0 = calcx0(fig, i);
      ctx.lineTo(x0 + 1, yCurr);
    }
    ctx.strokeStyle = getColor(j);
    ctx.fillStyle = getColor(j);
    ctx.fillText(upperIndicator.label, fig.leftPos, fig.marginTop + 1);
    ctx.stroke();
    var metrics = ctx.measureText(upperIndicator.label);
    leftPos += metrics.width + 5;
  }
}

//足の描画
function DrawCandle(fig, data) {
  var c = data.c;
  var o = data.o;
  var h = data.h;
  var l = data.l;
  var width = fig.width;
  var marginTop = fig.marginTop;
  var marginBottom = fig.marginBottom;
  var limarginTop = fig.limarginTop;
  var limarginBottom = fig.limarginBottom;
  var marginLeft = fig.marginLeft;
  var marginRight = fig.marginRight;
  var pixelsPerCandle = fig.pixelsPerCandle;
  var ll = fig.ll;
  var hh = fig.hh;
  var height = fig.height;

  for (var i = 0; i < c.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
    var yo = calcyPrev(fig, o[i])
      , yh = calcyPrev(fig, h[i])
      , yl = calcyPrev(fig, l[i])
      , yc = calcyPrev(fig, c[i])
      , x0 = calcx0(fig, i);
    ctx.beginPath();//body of the candle
    ctx.moveTo(x0 + 1, Math.min(yo, yc));
    ctx.lineTo(x0 + 1, Math.max(yo, yc));
    ctx.strokeStyle = o[i] < c[i] ? 'lightgreen' : 'red';
    if (o[i] > c[i]) {
      ctx.stroke();
    }

    //ひげ足のコード
    ctx.beginPath();
    ctx.moveTo(x0 + 1, yl);//lower wick
    ctx.lineTo(x0 + 1, Math.max(yo, yc));
    ctx.moveTo(x0 + 1, yh);//higher wick
    ctx.lineTo(x0 + 1, Math.min(yo, yc));
    ctx.moveTo(x0, yo);//box around the candle's body
    ctx.lineTo(x0, yc);
    ctx.lineTo(x0 + 2, yc);
    ctx.lineTo(x0 + 2, yo);
    ctx.lineTo(x0, yo);
    ctx.strokeStyle = 'black';
    ctx.stroke();
  }
}

function DrawCurve(fig, li, text, color) {
  var yPrev = calcyPrev(fig, li[0]), x0 = calcx0(fig);
  ctx.beginPath();
  ctx.moveTo(x0 + 1, yPrev);
  for (var i = 1; i < li.length && i < (fig.width - fig.marginLeft - fig.marginRight - fig.pixelsPerCandle) / fig.pixelsPerCandle; i++) {
    var yCurr = calcyPrev(fig, li[i]), x0 = calcx0(fig, i);
    ctx.lineTo(x0 + 1, yCurr);
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.fillText(text, leftPos, fig.liMarginTop + 5);
  metrics = ctx.measureText(text);
  leftPos += metrics.width + 5;
  ctx.stroke();
}

function DrawReal(fig, li, text, color) {
  var yPrev = calcyPrev(fig, li[0]), x0 = calcx0(fig);
  ctx.beginPath();
  ctx.setLineDash([2, 4]);
  ctx.moveTo(x0 + 1, yPrev);
  for (var i = 1; i < li.length && i < (fig.width - fig.marginLeft - fig.marginRight - fig.pixelsPerCandle) / fig.pixelsPerCandle; i++) {
    var yCurr = calcyPrev(fig, li[i]), x0 = calcx0(fig, i);
    ctx.lineTo(x0 + 1, yCurr);
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.fillText(text, leftPos, fig.liMarginTop + 5);
  metrics = ctx.measureText(text);
  leftPos += metrics.width + 5;
  ctx.stroke();
}

function DrawPredict(fig, li, text, color) {
  ctx.setLineDash([]);
  var yPrev = calcyPrev(fig, li[0]), x0 = calcx0(fig, 0);
  ctx.beginPath();
  ctx.moveTo(x0 + 1, yPrev);
  df = NaN
  for (var i = 1; i < li.length && i < (fig.width - fig.marginLeft - fig.marginRight - fig.pixelsPerCandle) / fig.pixelsPerCandle; i++) {
    var yCurr = calcyPrev(fig, li[i]), x0 = calcx0(fig, i);
    if (isNaN(df)) { df = li[i] - li[i + 1]; }
    else {
      if (Math.abs(df - (li[i] - li[i + 1])) > 0.01) { ctx.moveTo(x0 + 1, yCurr); }
      else { ctx.lineTo(x0 + 1, yCurr); }
      df = li[i] - li[i + 1];
    }
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.fillText(text, leftPos, fig.liMarginTop + 5);
  metrics = ctx.measureText(text);
  leftPos += metrics.width + 5;
  ctx.stroke();
}

function DrawCircle(fig, li, text, color) {
  ctx.beginPath();
  for (var i = 1; i < li.length && i < (fig.width - fig.marginLeft - fig.marginRight - fig.pixelsPerCandle) / fig.pixelsPerCandle; i++) {
    var yCurr = calcyPrev(fig, li[i]), x0 = calcx0(fig, i);
    ctx.moveTo(x0 + 1, yCurr);
    ctx.arc(x0 + 1, yCurr, 5, 0, Math.PI * 2, true); // 外の円
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.fillText(text, leftPos, fig.liMarginTop + 5);
  metrics = ctx.measureText(text);
  leftPos += metrics.width + 5;
  ctx.fill();
}