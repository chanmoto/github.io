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
    for(var i = 0; i < RSI.length - 1; i++) {
        kBuf[i] = (RSI[i] - MovRsi[i]) / MovRsi[i];
    }

    //区間に分けて考えていく
    j = 0;
    var ii = new Array();
    for(var i = 1; j < 20; i++) {
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
        for(var linel = 0; linel < nLine + 3; linel++) {
            var a1 = ii[0 + linel * 2] + 1;
            var a2 = ii[1 + linel * 2] + 1;
            var b1 = ii[1 + linel * 2] + 1;
            var b2 = ii[2 + linel * 2] + 1;

            HiStack[linel] = RSI.indexOf(RSI.slice(a1, a2).reduce((a, b) => a > b ? a : b), a1);
            LoStack[linel] = RSI.indexOf(RSI.slice(b1, b2).reduce((a, b) => a < b ? a : b), b1);
            console.log(a1, a2, b1, b2);
        }
    }
    else {
        for(var linel = 0; linel < nLine + 3; linel++) {
            var a1 = ii[1 + linel * 2] + 1;
            var a2 = ii[2 + linel * 2] + 1;
            var b1 = ii[0 + linel * 2] + 1;
            var b2 = ii[1 + linel * 2] + 1;

            HiStack[linel] = RSI.indexOf(RSI.slice(a1, a2).reduce((a, b) => a > b ? a : b), a1);
            LoStack[linel] = RSI.indexOf(RSI.slice(b1, b2).reduce((a, b) => a < b ? a : b), b1);
            console.log(a1, a2, b1, b2);
        }
    }

    var buf1 = new Array();
    var buf2 = new Array();
    var buf3 = new Array();
    var buf4 = new Array();
    var buf5 = new Array();
    var buf6 = new Array();

    for(var i = 0; i < RSI.length - 1; i++) {
        buf1[i] = NaN;
        buf2[i] = NaN;
        buf3[i] = NaN;
        buf4[i] = NaN;
        buf5[i] = NaN;
        buf6[i] = NaN;
    }

    for(var linel = 0; linel < nLine; linel++) {
        var hp1 = RSI[HiStack[linel]];
        var hp2 = RSI[HiStack[linel + 1]];
        var hp1n = HiStack[linel];
        var hp2n = HiStack[linel + 1];
        var hp3n = HiStack[linel - 1];

        if (hp2n != hp1n) { rh = ((hp2 - hp1) / (hp2n - hp1n)); }

        var lp1 = RSI[LoStack[linel]];
        var lp2 = RSI[LoStack[linel + 1]];
        var lp1n = LoStack[linel];
        var lp2n = LoStack[linel + 1];
        var lp3n = LoStack[linel - 1];

        if (lp1n != lp2n) { rl = ((lp1 - lp2) / (lp2n - lp1n)); }

        for (var k = 0; k < hp2n - hp1n; k++) { buf1[hp1n + k] = hp1 + rh * k; }
        for (var k = 0; k < lp2n - lp1n; k++) { buf2[lp1n + k] = lp1 - rl * k; }
        if (typeof hp3n  == "undefined") {
            for (var k = 0; k <= hp1n; k++) { buf3[hp1n - k] = hp1 - rh * k; }
        }
        else {
            for (var k = 0; k <= hp1n - hp3n - 1; k++) { buf3[hp1n - k] = hp1 - rh * k; }
        }

        if (typeof hp3n  == "undefined") {
            for (var k = 0; k <= lp1n; k++) { buf4[lp1n - k] = lp1 + rl * k; }
        }
        else {
        for (var k = 0; k <= lp1n - lp3n - 1; k++) { buf4[lp1n - k] = lp1 + rl * k; }
        }
    }

    for(var i = 0; i < RSI.length - 1; i++) {
        // SElinel 
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
    for (var i = 0; i < Price.length; i++) {
        sma[i] = 0;
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
     for (var i = 0; i < Price.length; i++) {
        rsiArr[i] = 0;
    }

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
    if( isNaN(rs)){rs=0.5;}
    var rsi = 100 - (100 / (1 + rs));
    rsiArr.push(rsi);

    for (var i = Period + 1 ; i < Price.length; i++) {
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
        if( isNaN(rs)){rs=0.5;}
        rsi = 100 - (100 / (1 + rs));
        rsiArr.push(rsi);
    }
    Price.reverse();// 元に戻す
    rsiArr.reverse();// SMAを反転させる
    return rsiArr;
}