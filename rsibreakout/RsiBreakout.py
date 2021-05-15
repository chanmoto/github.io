import numpy as np
import pdb


def RSI_BREAKOUT(RSI, date, indicator):
    nPeriod_MA = indicator["rsimov_period"]
    nLine =  indicator["nLine"]
    min_gap = indicator["min_gap"]
    margin =  indicator["margin"]

    MovRsi = CalculateSMA(RSI, nPeriod_MA)

    # RSIの乖離率を求める
    kBuf = []
    for i in range(len(RSI)):
        try:
            kBuf.append((RSI[i] - MovRsi[i]) / MovRsi[i])
        except:
            pass
    # 区間に分けて考えていく

    ii = []
    i = 0

    while True:
        try:
            if kBuf[i] * kBuf[i + 1] <= 0:  # 変極点をiiにプールする
                ii.append(i)
                if len(ii) > 2:
                    if ii[-1] - ii[-3] < min_gap:
                        # gap狭い場合はリジェクトする
                        ii.pop()
                        ii.pop()
        except:
            break
        finally:
            i = i+1

    HiStack = []
    LoStack = []

    # 乖離率の変曲点で、上下をグループ分けする。
    if kBuf[ii[0]] < 0:
        linel = 0
        while linel < nLine+1:
            a1 = ii[0 + linel * 2] + 1
            a2 = ii[1 + linel * 2] + 1
            b1 = ii[1 + linel * 2] + 1
            b2 = ii[2 + linel * 2] + 1

            HiStack.append(RSI.index(max(RSI[a1:a2])))
            LoStack.append(RSI.index(min(RSI[b1:b2])))
            linel = linel + 1

    else:
        linel = 0
        while linel < nLine+1:
            a1 = ii[1 + linel * 2] + 1
            a2 = ii[2 + linel * 2] + 1
            b1 = ii[0 + linel * 2] + 1
            b2 = ii[1 + linel * 2] + 1

            HiStack.append(RSI.index(max(RSI[a1:a2])))
            LoStack.append(RSI.index(min(RSI[b1:b2])))
            linel = linel + 1

    buf1 = []
    buf2 = []
    buf3 = []
    buf4 = []
    buf5 = []
    buf6 = []

    for i in range(len(RSI)):
        buf1.append(np.nan)
        buf2.append(np.nan)
        buf3.append(np.nan)
        buf4.append(np.nan)
        buf5.append(0)
        buf6.append(0)

    linel = 0
    rh = 0
    rl = 0

    while linel < nLine:
        hp1 = RSI[HiStack[linel]]
        hp2 = RSI[HiStack[linel + 1]]
        hp1n = HiStack[linel]
        hp2n = HiStack[linel + 1]
        hp3n = HiStack[linel - 1]

        if hp2n != hp1n:
            rh = ((hp2 - hp1) / (hp2n - hp1n))

        lp1 = RSI[LoStack[linel]]
        lp2 = RSI[LoStack[linel + 1]]
        lp1n = LoStack[linel]
        lp2n = LoStack[linel + 1]
        lp3n = LoStack[linel - 1]

        if lp1n != lp2n:
            rl = ((lp1 - lp2) / (lp2n - lp1n))

        for k in range(0, hp2n - hp1n):
            buf1[hp1n + k] = hp1 + rh * k

        for k in range(0, lp2n - lp1n):
            buf2[lp1n + k] = lp1 - rl * k

        if(linel != 0):
            for k in range(0, hp1n - hp3n - 1):
                buf3[hp1n - k] = hp1 - rh * k
            for k in range(0, lp1n - lp3n - 1):
                buf4[lp1n - k] = lp1 + rl * k
        else:
            for k in range(0, hp1n+1):
                buf3[hp1n - k] = hp1 - rh * k
            for k in range(0, lp1n+1):
                buf4[lp1n - k] = lp1 + rl * k

        linel = linel + 1

    for i in range(0, len(RSI) - 1):
        try:
            if (buf4[i] >= buf4[i + 1]
                and abs((buf4[i] - buf4[i + 1]) - (buf4[i - 1] - buf4[i])) < 0.001
                and RSI[i] < buf4[i]
                and RSI[i + 2] > buf4[i + 2]
                    and buf4[i + 1] - RSI[i + 1] > margin):

                #            if buf4[i] >= buf4[i + 1] and abs((buf4[i] - buf4[i + 1]) - (buf4[i - 1] - buf4[i])) < 0.001 and RSI[i] < buf4[i] and RSI[i + 2] > buf4[i + 2] and buf4[i + 1] - RSI[i + 1] > margin:
                buf6[i] = RSI[i]
            else:
                buf6[i] = np.nan
        except:
            pass

    for i in range(0, len(RSI) - 1):
        try:

            if (buf3[i] <= buf3[i + 1]
                and abs((buf3[i] - buf3[i + 1]) - (buf3[i - 1] - buf3[i])) < 0.001
                and RSI[i] > buf3[i]
                and RSI[i + 2] < buf3[i + 2]
                    and RSI[i + 1] - buf3[i + 1] > margin):

                # if buf3[i] <= buf3[i + 1] and abs((buf3[i] - buf3[i + 1]) - (buf3[i - 1] - buf3[i])) < 0.001 and RSI[i] > buf3[i] and RSI[i + 2] < buf3[i + 2] and RSI[i + 1] - buf3[i + 1] > margin:
                buf5[i] = RSI[i]
            else:
                buf5[i] = np.nan
        except:
            pass

    return {'rsi': RSI, 'date': date, 'rsimov': MovRsi, 'buf1': buf1, 'buf2': buf2, 'buf3': buf3, 'buf4': buf4, 'buf5': buf5, 'buf6': buf6}


def CalculateSMA(Price, Period):
    sma = []
    for i in range(0, len(Price)):
        try:
            sma.append(sum(Price[i:i+Period-1]) / Period)
        except:
            sma.append(0)

    return sma


def CalculateRsi(Price, Period):
    Price.reverse()  # 便宜的に逆転させる

    rsiArr = []
    for i in range(Period):
        rsiArr.append(0)

    gs = 0
    ls = 0

    for i in range(1, Period):
        dPrice = Price[i] - Price[i - 1]
        if (dPrice > 0):
            gs += dPrice
        else:
            ls += (-1) * dPrice

    ag = gs / Period
    al = ls / Period
    rs = ag / al

    rsi = 100 - (100 / (1 + rs))
    rsiArr.append(rsi)

    for i in range(Period + 1, len(Price)):
        dPrice = Price[i] - Price[i - 1]
        if dPrice > 0:
            ag = (ag * (Period - 1) + dPrice) / Period
            al = (al * (Period - 1)) / Period
        else:
            ag = (ag * (Period - 1)) / Period
            al = (al * (Period - 1) + (-1) * dPrice) / Period

        rs = ag / al
        rsi = 100 - (100 / (1 + rs))
        rsiArr.append(rsi)

    rsiArr.reverse()
    return rsiArr
