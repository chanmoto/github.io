/*!
 * CandleStickChart.js
 * Copyright 2013 Ami Heines
 * Released under the MIT license
 */
window.Candlestick = function (canvasID, rawData, options) {
  // utility finctions
  this.Max = function Max(array) { return Math.max.apply(Math, array); }
  this.Min = function Min(array) { return Math.min.apply(Math, array); }

  // END OF utility functions
  // add format to strings -- from https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
  if (!String.prototype.format) {
    String.prototype.format = function () {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
      });
    };
  }

  // end of add format to string, test with: "{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
  var chart = this;
  var ctx = document.getElementById(canvasID).getContext("2d");
  var width = ctx.canvas.width;
  var height = ctx.canvas.height;
  //High pixel density displays - multiply the size of the canvas height/width by the device pixel ratio, then scale.
  if (window.devicePixelRatio) {
    ctx.canvas.style.width = width + "px";
    ctx.canvas.style.height = height + "px";
    ctx.canvas.height = height * window.devicePixelRatio;
    ctx.canvas.width = width * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  ctx.translate(0.5, 0.5);
  //////////////////////////////////////////////////////////
  var oCandle = convertYahooFinanceCsvToCandles(rawData);//csvデータを変換する
  var d = oCandle.d
    , o = oCandle.o
    , h = oCandle.h
    , l = oCandle.l
    , c = oCandle.c
    , v = oCandle.v;
  var pixelsPerCandle = 4
    , marginTop = 8
    , marginBottom = 200
    , marginLeft = 5
    , marginRight = 23;
  var hh1 = this.Max(h.slice(0, Math.min(h.length, (width - marginLeft - marginRight) / pixelsPerCandle)));// ろうそくの最高値
  var ll1 = this.Min(l.slice(0, Math.min(l.length, (width - marginLeft - marginRight) / pixelsPerCandle)));// ろうそくの最低値
  // improve hh, ll
  var range = hh1 - ll1;//高さのレンジ
  step = Math.floor(Math.log10(range));

  ll = Math.pow(10,step) * Math.floor(ll1 / Math.pow(10,step));//数値以下の最大の整数を返します
  hh = Math.pow(10,step) * Math.ceil(hh1 / Math.pow(10,step));//数値以上の最小の整数を返します
  ///////////////////////////////////////////////////////
  // calculate the indicators
  // currently only SMA and EMA
  //console.log('indicators');
  //console.log(indicators);

  var upperIndicators = new Array();
  var lowerIndicators = new Array();
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
      lowerIndicators.push({
        label: 'RSI(' + indicator[1] + ',' + indicator[2] + '+' + indicator[3] + '+' + indicator[4] + '+' + indicator[5] + '+' + indicator[6] + ')'
        , data: RSI(oCandle[indicator[1]], indicator[2], indicator[3], indicator[4], indicator[5], indicator[6])
      });
    }
  }

  ///////////////////////////////////////////////////////

  ctx.fillStyle = "rgb(240,240,220)";//pale yellow
  ctx.fillRect(0, 0, width - 1, height - 1);
  ctx.fillStyle = "rgb(250,250,200)";//pale yellow
  ctx.fillRect(marginLeft, marginTop, width - marginLeft - marginRight, height - marginTop - marginBottom);
  //ctx.strokeRect(0,0,width-1,height-1);// just for fun, frame the whole canvas
  // Y coordinate - prices ticks
  for (var i = ll; i <= hh; i += Math.pow(10,step)) {
    var y0 = scale(ll, hh, height, marginTop, marginBottom, i);
    ctx.moveTo(marginLeft, y0);
    ctx.lineTo(width - marginRight, y0);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.fillText(i, width - marginRight + 2, y0);
  }
  ctx.strokeStyle = 'rgb(200,200,150)';
  ctx.stroke();

  // X coordinate - month ticks (for weekly charts, for daily chart use 3 letter for each month)
  ctx.beginPath();
  var y0 = scale(ll, hh, height, marginTop, marginBottom, ll);
  var y1 = scale(ll, hh, height, marginTop, marginBottom, hh);
  for (var i = 0; i < d.length - 1 && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
    if (d[i].getMonth() != d[i + 1].getMonth()) {
      var x0 = (width - marginRight) - (i + 1) * pixelsPerCandle - 1;
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y1);
      mm = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C'][d[i].getMonth()];
      if (d[i].getMonth() == 0) {
        mm = ('' + d[i].getFullYear()).substr(2, 2);
      }
      ctx.textBaseline = 'top';
      var metrics = ctx.measureText(mm);
      ctx.fillText(mm, x0 - metrics.width / 2, y0);
    }
  }


  ctx.strokeStyle = 'rgb(200,200,150)';
  ctx.stroke();
  // draw the upperIndicators, SMA and EMA arrays
  var leftPos = marginLeft + 5;
  ctx.fillStyle = 'black';
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(options.title, leftPos, marginTop + 1);
  toppos = 20;
  ctx.fillText(d[0].toLocaleDateString(), leftPos, marginTop +toppos+ 1);
  //leftPos += metrics.width + 5;
  toppos += 20;


  for (var j = 0; j < upperIndicators.length; j++) {
    var upperIndicator = upperIndicators[j];
    var yPrev = scale(ll, hh, height, marginTop, marginBottom, upperIndicator.arr[0])
      , x0 = (width - marginRight) - pixelsPerCandle;
    ctx.beginPath();// the upperIndicators line
    ctx.moveTo(x0 + 1, yPrev);
    for (var i = 1; i < c.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
      var yCurr = scale(ll, hh, height, marginTop, marginBottom, upperIndicator.arr[i]);
      x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
      ctx.lineTo(x0 + 1, yCurr);
    }
    ctx.strokeStyle = getColor(j);
    ctx.fillStyle = getColor(j);
    ctx.fillText(upperIndicator.label, leftPos, marginTop + toppos+ 1);
    ctx.stroke();
    var metrics = ctx.measureText(upperIndicator.label);
    //leftPos += metrics.width + 5;
    toppos += 20;
  }

  // draw the lowerIndocator, MACD
  ctx.font = "bold 12px sans-serif";
  // draw the background of the MACD chart
  ctx.fillStyle = "rgba(200,250,200, .5)";
  var liMarginTop = height - marginBottom + 10;// li===LowerIndicator
  var liMarginBottom = 10;
  ctx.fillRect(marginLeft, liMarginTop, width - marginLeft - marginRight, marginBottom - 20);

  for (var j = 0; j < lowerIndicators.length; j++) {
    var li = lowerIndicators[j].data;
    var llabel = lowerIndicators[j].label;
    var lihh = this.Max(li.rsi.slice(0, Math.min(li.rsi.length, (width - marginLeft - marginRight) / pixelsPerCandle))) * 1.1; // find highest high in MACD
    var lill = this.Min(li.rsi.slice(0, Math.min(li.rsi.length, (width - marginLeft - marginRight) / pixelsPerCandle))) * 0.9;

    // RSI line
    var yPrev = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.rsi[0])
      , x0 = (width - marginRight) - pixelsPerCandle;
    ctx.beginPath();
    ctx.moveTo(x0 + 1, yPrev);
    for (var i = 1; i < li.rsi.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
      var yCurr = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.rsi[i]);
      x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
      ctx.lineTo(x0 + 1, yCurr);
    }

    //ラベル
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    leftPos = marginLeft + 5;
    ctx.fillText(llabel, leftPos, liMarginTop + 5);
    metrics = ctx.measureText(llabel);
    leftPos += metrics.width + 5;
    ctx.stroke();

    // rsimov
    var yPrev = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.rsimov[0])
      , x0 = (width - marginRight) - pixelsPerCandle;
    ctx.beginPath();
    ctx.moveTo(x0 + 1, yPrev);
    for (var i = 1; i < li.rsimov.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
      var yCurr = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.rsimov[i]);
      x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
      ctx.lineTo(x0 + 1, yCurr);
    }
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.fillText('rsimov', leftPos, liMarginTop + 5);
    metrics = ctx.measureText('rsimov');
    leftPos += metrics.width + 5;
    ctx.stroke();

    // buf1
    var yPrev = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf1[0])
      , x0 = (width - marginRight) - pixelsPerCandle;
    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.moveTo(x0 + 1, yPrev);
    for (var i = 1; i < li.buf1.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
      var yCurr = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf1[i]);
      x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
      ctx.lineTo(x0 + 1, yCurr);
    }
    ctx.strokeStyle = 'blue';
    ctx.fillStyle = 'blue';
    ctx.fillText('buf1', leftPos, liMarginTop + 5);
    metrics = ctx.measureText('buf1');
    leftPos += metrics.width + 5;
    ctx.stroke();

    // buf2
    var yPrev = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf2[0])
      , x0 = (width - marginRight) - pixelsPerCandle;
    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.moveTo(x0 + 1, yPrev);
    for (var i = 1; i < li.buf2.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
      var yCurr = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf2[i]);
      x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
      ctx.lineTo(x0 + 1, yCurr);
    }
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.fillText('buf2', leftPos, liMarginTop + 5);
    metrics = ctx.measureText('buf2');
    leftPos += metrics.width + 5;
    ctx.stroke();

    // buf3
    var yPrev = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf3[0])
      , x0 = (width - marginRight) - pixelsPerCandle;
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(x0 + 1, yPrev);
    df = NaN;
    for (var i = 1; i < li.buf3.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
      var yCurr = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf3[i]);
      x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
      if (isNaN(df)) {
        df = li.buf3[i] - li.buf3[i + 1];
      }
      else {
        if (Math.abs(df - (li.buf3[i] - li.buf3[i + 1])) > 0.01) {
          ctx.moveTo(x0 + 1, yCurr);
        }
        else {
          ctx.lineTo(x0 + 1, yCurr);
        }
        df = li.buf3[i] - li.buf3[i + 1];
      }
    }
    ctx.strokeStyle = 'blue';
    ctx.fillStyle = 'blue';
    ctx.fillText('buf3', leftPos, liMarginTop + 5);
    metrics = ctx.measureText('buf3');
    leftPos += metrics.width + 5;
    ctx.stroke();

    // buf4
    var yPrev = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf4[0])
      , x0 = (width - marginRight) - pixelsPerCandle;
    ctx.beginPath();
    ctx.moveTo(x0 + 1, yPrev);
    df = NaN
    for (var i = 1; i < li.buf4.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
      var yCurr = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf4[i]);
      x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
      if (isNaN(df)) {
        df = li.buf4[i] - li.buf4[i + 1];
      }
      else {
        if (Math.abs(df - (li.buf4[i] - li.buf4[i + 1])) > 0.01) {
          ctx.moveTo(x0 + 1, yCurr);
        }
        else {
          ctx.lineTo(x0 + 1, yCurr);
        }
        df = li.buf4[i] - li.buf4[i + 1];
      }
    }
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.fillText('buf4', leftPos, liMarginTop + 5);
    metrics = ctx.measureText('buf4');
    leftPos += metrics.width + 5;
    ctx.stroke();

    // buf5
    ctx.beginPath();
    for (var i = 1; i < li.buf5.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
      var yCurr = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf5[i]);
      x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
      ctx.moveTo(x0 + 1, yCurr);
      ctx.arc(x0 + 1, yCurr, 5, 0, Math.PI * 2, true); // 外の円
    }
    ctx.strokeStyle = 'blue';
    ctx.fillStyle = 'blue';
    ctx.fillText('buf5', leftPos, liMarginTop + 5);
    metrics = ctx.measureText('buf5');
    leftPos += metrics.width + 5;
    ctx.fill();

    // buf6
    ctx.beginPath();
    for (var i = 1; i < li.buf6.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
      var yCurr = scale(lill, lihh, height, liMarginTop, liMarginBottom, li.buf6[i]);
      x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
      ctx.moveTo(x0 + 1, yCurr);
      ctx.arc(x0 + 1, yCurr, 5, 0, Math.PI * 2, true); // 外の円
    }
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.fillText('buf6', leftPos, liMarginTop + 5);
    metrics = ctx.measureText('buf6');
    leftPos += metrics.width + 5;
    ctx.fill();
  }

  //足の描画
  for (var i = 0; i < c.length && i < (width - marginLeft - marginRight - pixelsPerCandle) / pixelsPerCandle; i++) {
    var yo = scale(ll, hh, height, marginTop, marginBottom, o[i])
      , yh = scale(ll, hh, height, marginTop, marginBottom, h[i])
      , yl = scale(ll, hh, height, marginTop, marginBottom, l[i])
      , yc = scale(ll, hh, height, marginTop, marginBottom, c[i])
      , x0 = (width - marginRight) - (i + 1) * pixelsPerCandle;
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

//  upperIndicators.push(lowerIndicator);
//  this.data = [oCandle, upperIndicators];

  // misc functions
  function scale(ll, hh, height, marginTop, marginBottom, y) {
    return marginTop + (height - marginTop - marginBottom) * (1 - (y - ll) / (hh - ll));
  }

  ///　足チャートを書くコード
  function convertYahooFinanceCsvToCandles(rawData) {
    var allTextLines = rawData.split(/\r\n|\n/);
    allTextLines.pop();// 最終行の/nを含む要素を削除 
    allTextLines.shift();// 配列のヘッダーを削除
    allTextLines = allTextLines.slice(options.offset);//オフセット分をスライスする
    var d = [], o = [], h = [], l = [], c = [], v = [];//変数クリア
    if (typeof options.adjust == 'undefined') { options.adjust = 0; }//typeof 演算子が返す値 = undefined なら０にする
    for (var i = 0; i < allTextLines.length; i++) {
      var entries = allTextLines[i].split(',');//CSV分離
      d.push(new Date(entries[0]));//0列をDATA変換して、dに入れる
      var oo = entries[1]
        , hh = entries[2]
        , ll = entries[3]
        , cc = entries[4]
        , vv = entries[5]
        , adjC = entries[6];
      var ratio;
      if (options.adjust == 0) {//ADJUSTで分岐処理
        ratio = 1;
      } else if (options.adjust == 1) {
        ratio = adjC / cc;
      } else if (options.adjust == 2) {
        ratio = adjC / cc;
      }
      o.push(Number(oo));//Number」オブジェクトのメソッドtoFixed	四捨五入もしくは小数点の桁数を指定する
      h.push(Number(hh));
      l.push(Number(ll));
      c.push(Number(cc));
      v.push(Number(vv));
    }
    return { d: d, o: o, h: h, l: l, c: c, v: v };//戻り値を{}で括り、オブジェクトを返す
  }

  function getColor(j) {
    var colors = ['coral', 'crimson', 'darkblue', 'chocolate', 'chartreuse', 'blueviolet', 'darksalmon'];
    return colors[j % colors.length];
  }

  function SMA(array, smaLength) {
    array.reverse(); // easier on my limited brain to think of the array in the "proper" order
    var sma = new Array();
    for (var i = 0; i < smaLength - 1; i++) {
      sma[i] = NaN;
    }
    sma[smaLength - 1] = array.slice(0, smaLength).reduce(function (a, b) { return a + b }) / smaLength;
    for (var i = smaLength; i < array.length; i++) {
      sma[i] = sma[i - 1] + (array[i] - array[i - smaLength]) / smaLength;
    }
    sma.reverse();// reverse back for main consumption
    array.reverse();// reverse back
    return sma;
  }

  function EMA(originalArray, emaLength) {
    var array = originalArray.slice().reverse(); // easier on my limited brain to think of the array in the "proper" order
    // trim initial NaN values
    var iPos = 0;
    for (iPos = 0; iPos < array.length && isNaN(array[iPos]); iPos++) { }
    array = array.slice(iPos);// trim initial NaN values from array
    var ema = new Array();
    var k = 2 / (emaLength + 1);
    for (var i = 0; i < emaLength - 1; i++) {
      ema[i] = NaN;
    }
    ema[emaLength - 1] = array.slice(0, emaLength).reduce(function (a, b) { return a + b }) / emaLength;
    for (var i = emaLength; i < array.length; i++) {
      ema[i] = array[i] * k + ema[i - 1] * (1 - k);
    }
    ema.reverse();// reverse back for main consumption
    for (var i = 0; i < iPos; i++) {
      ema.push(NaN);
    }
    return ema;
  }

  //MACD のラインチャート

  function MACD(array, i12, i26, i9) {
    var ema12 = EMA(oCandle.c, i12);
    var ema26 = EMA(oCandle.c, i26);
    var macd = [];
    for (var i = 0; i < ema12.length; i++) { macd.push(ema12[i] - ema26[i]); }
    var signal = EMA(macd, i9);
    var histogram = [];
    for (var i = 0; i < macd.length; i++) { histogram.push(macd[i] - signal[i]); }
    return { macd: macd, signal: signal, histogram: histogram };
  }
  this.drawLine = function (i0, v0, i1, v1, style, linewidth) {
    var y0 = scale(ll, hh, height, marginTop, marginBottom, v0);
    var y1 = scale(ll, hh, height, marginTop, marginBottom, v1);
    var x0 = (width - marginRight) - (i0 + 1) * pixelsPerCandle + 1;
    var x1 = (width - marginRight) - (i1 + 1) * pixelsPerCandle + 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = style;
    ctx.lineWidth = linewidth;
    ctx.stroke();
  }
}

