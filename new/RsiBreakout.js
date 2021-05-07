/*!
 * RsiBleakout.js
 * Copyright 2021 Motohisa Tamazawa
 * Released under the MIT license
 */

function RSI(Price, Period, nPeriod_MA, nLine, min_gap, margin) {

    var RSI = CalculateRsi(Price, Period);
    var MovRsi = CalculateSMA(RSI, nPeriod_MA);

    //RSIの乖離率を求める
    var kBuf = new Array();
    for (i = 0; i < RSI.length - 1; i++) {
        kBuf[i] = (RSI[i] - MovRsi[i]) / MovRsi[i];
    }

    //区間に分けて考えていく
    j = 0;
    var ii = new Array();
    for (i = 1; j < nLine * 5; i++) {
        if (kBuf[i] * kBuf[i + 1] <= 0) {//変極点をiiにプールする
            ii[j] = i;
            j++;
            if (j > 2) {
                if (ii[j - 1] - ii[j - 3] < min_gap) {//gap狭い場合はリジェクトする
                    j = j - 2;
                }
            }
        }
    }

    var HiStack = new Array();
    var LoStack = new Array();

    //乖離率の変曲点で、上下をグループ分けする。
    if (kBuf[ii[0]] < 0) {
        for (ll = 0; ll < nLine + 3; ll++) {
            var a1 = ii[0 + ll * 2] + 1;
            var a2 = ii[1 + ll * 2] + 1;
            var b1 = ii[1 + ll * 2] + 1;
            var b2 = ii[2 + ll * 2] + 1;

            HiStack[ll] = RSI.indexOf(RSI.slice(a1, a2).reduce((a, b) => a > b ? a : b), a1);
            LoStack[ll] = RSI.indexOf(RSI.slice(b1, b2).reduce((a, b) => a < b ? a : b), b1);
            console.log(a1, a2, b1, b2);
        }
    }
    else {
        for (ll = 0; ll < nLine + 3; ll++) {
            var a1 = ii[1 + ll * 2] + 1;
            var a2 = ii[2 + ll * 2] + 1;
            var b1 = ii[0 + ll * 2] + 1;
            var b2 = ii[1 + ll * 2] + 1;

            HiStack[ll] = RSI.indexOf(RSI.slice(a1, a2).reduce((a, b) => a > b ? a : b), a1);
            LoStack[ll] = RSI.indexOf(RSI.slice(b1, b2).reduce((a, b) => a < b ? a : b), b1);
            console.log(a1, a2, b1, b2);
        }
    }

    var buf1 = new Array();
    var buf2 = new Array();
    var buf3 = new Array();
    var buf4 = new Array();
    var buf5 = new Array();
    var buf6 = new Array();

    for (i = 0; i < RSI.length - 1; i++) {
        buf1[i] = NaN;
        buf2[i] = NaN;
        buf3[i] = NaN;
        buf4[i] = NaN;
        buf5[i] = NaN;
        buf6[i] = NaN;
    }

    for (ll = 0; ll < nLine; ll++) {
        var hp1 = RSI[HiStack[ll]];
        var hp2 = RSI[HiStack[ll + 1]];
        var hp1n = HiStack[ll];
        var hp2n = HiStack[ll + 1];
        var hp3n = HiStack[ll - 1];

        if (hp2n != hp1n) { rh = ((hp2 - hp1) / (hp2n - hp1n)); }

        var lp1 = RSI[LoStack[ll]];
        var lp2 = RSI[LoStack[ll + 1]];
        var lp1n = LoStack[ll];
        var lp2n = LoStack[ll + 1];
        var lp3n = LoStack[ll - 1];

        if (lp1n != lp2n) { rl = ((lp1 - lp2) / (lp2n - lp1n)); }

        for (var k = 0; k < hp2n - hp1n; k++) { buf1[hp1n + k] = hp1 + rh * k; }
        for (var k = 0; k < lp2n - lp1n; k++) { buf2[lp1n + k] = lp1 - rl * k; }
        if (typeof hp3n == "undefined") {
            for (var k = 0; k <= hp1n; k++) { buf3[hp1n - k] = hp1 - rh * k; }
        }
        else {
            for (var k = 0; k <= hp1n - hp3n - 1; k++) { buf3[hp1n - k] = hp1 - rh * k; }
        }

        if (typeof hp3n == "undefined") {
            for (var k = 0; k <= lp1n; k++) { buf4[lp1n - k] = lp1 + rl * k; }
        }
        else {
            for (var k = 0; k <= lp1n - lp3n - 1; k++) { buf4[lp1n - k] = lp1 + rl * k; }
        }
    }

    for (i = 0; i < RSI.length - 1; i++) {
        // SELL 
        if (buf4[i] >= buf4[i + 1] && Math.abs((buf4[i] - buf4[i + 1]) - (buf4[i - 1] - buf4[i])) < 0.001 && RSI[i] < buf4[i] && RSI[i + 2] > buf4[i + 2] && buf4[i + 1] - RSI[i + 1] > margin) {
            buf6[i] = RSI[i];
        } else {
            buf6[i] = NaN;
        }
        // BUY   
        if (buf3[i] <= buf3[i + 1] && Math.abs((buf3[i] - buf3[i + 1]) - (buf3[i - 1] - buf3[i])) < 0.001 && RSI[i] > buf3[i] && RSI[i + 2] < buf3[i + 2] && RSI[i + 1] - buf3[i + 1] > margin) {
            buf5[i] = RSI[i];
        } else {
            buf5[i] = NaN;
        }
    }
    return { rsi: RSI, rsimov: MovRsi, buf1: buf1, buf2: buf2, buf3: buf3, buf4: buf4, buf5: buf5, buf6: buf6 };
}

function CalculateSMA(Price, Period) {
    Price.reverse(); // 便宜的に逆転させる
    var sma = new Array();
    for (var i = 0; i < Period - 1; i++) {
        sma[i] = NaN;
    }
    sma[Period - 1] = Price.slice(0, Period).reduce(function (a, b) { return a + b }) / Period;
    for (var i = Period; i < Price.length; i++) {
        sma[i] = sma[i - 1] + (Price[i] - Price[i - Period]) / Period;
    }
    Price.reverse();// 元に戻す
    sma.reverse();// SMAを反転させる
    return sma;
}

function CalculateRsi(Price, Period) {
    Price.reverse(); // 便宜的に逆転させる
    var rsiArr = new Array();
    var gs = 0;
    var ls = 0;

    for (var i = 1; i < Period; i++) {
        var dPrice = Price[i] - Price[i - 1];
        if (dPrice > 0) {
            gs += dPrice;
        }
        else {
            ls += (-1) * dPrice;
        }
    }

    var ag = gs / Period;
    var al = ls / Period;
    var rs = ag / al;
    var rsi = 100 - (100 / (1 + rs));
    rsiArr.push(rsi);

    for (var i = Period + 1; i < Price.length; i++) {
        var dPrice = Price[i] - Price[i - 1];
        if (dPrice > 0) {
            ag = (ag * (Period - 1) + dPrice) / Period;
            al = (al * (Period - 1)) / Period;
        }
        else {
            ag = (ag * (Period - 1)) / Period;
            al = (al * (Period - 1) + (-1) * dPrice) / Period;
        }
        rs = ag / al;
        rsi = 100 - (100 / (1 + rs));
        rsiArr.push(rsi);
    }
    Price.reverse();// 元に戻す
    rsiArr.reverse();// SMAを反転させる
    return rsiArr;
}

function convertYahooFinanceCsvToCandles(rawData, offset,length) {
    var allTextLines = rawData.split(/\r\n|\n/);
    allTextLines.pop();// 最終行の/nを含む要素を削除 
    allTextLines.shift();// 配列のヘッダーを削除
    allTextLines = allTextLines.slice(offset);//オフセット分をスライスする
    var data = [];
    for (var i = 0; i < length; i++) {
        var entries = allTextLines[i].split(',');//CSV分離
        var d = new Date(entries[0])
        var ohlc = [Number(entries[1]), Number(entries[2]), Number(entries[3]), Number(entries[4])]
        data.push({x:d,y:ohlc})
    }
    return data;
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