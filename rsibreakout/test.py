from RsiBreakout import RSI_BREAKOUT,CalculateRsi
#import util
import pandas as pd
import mplfinance as mpf
import pdb

if __name__ == '__main__':
    import sys
    indicator= {"rsi_period":20, "rsimov_period": 20, "nLine":10, "min_gap":1, "margin":0.0001}

    df = pd.read_csv('../data/eurusd_daily.csv', index_col=0, parse_dates=True)
    df.columns = ['Open', 'High', 'Low', 'Close', 'Volume']

    Ind=[]
    data = df.index.tolist()

    Price=df['High'].tolist()
    Ind.append(CalculateRsi(Price, indicator["rsi_period"]))

    Price=df['Low'].tolist()
    Ind.append(CalculateRsi(Price, indicator["rsi_period"]))

    Price=df['Close'].tolist()
    Ind.append(CalculateRsi(Price, indicator["rsi_period"]))

    combine = [(x + y + z)/3 for (x, y,z) in zip(Ind[0],Ind[1],Ind[2])]
    Ind = RSI_BREAKOUT(combine,data, indicator)

    df1 = pd.DataFrame.from_dict(Ind)
    df1.set_index("date",inplace=True)

    all = pd.concat([df,df1], axis=1)# 横方向
    all = all.sort_index()
    all = all.tail(80)
    all.loc[all.index[0]]={'buf1': 0, 'buf2': 0,'buf3': 0, 'buf4': 0,'buf5': 0, 'buf6': 0}

    add_plot = [
        mpf.make_addplot(all['rsi'], color='m', panel=1, ylim=[20,80]),
        mpf.make_addplot(all['rsimov'], color='c', panel=1, ylim=[20,80]),
        mpf.make_addplot(all['buf1'], color='b', panel=1, linestyle="dashed",ylim=[20,80]),
        mpf.make_addplot(all['buf2'], color='r', panel=1, linestyle="dashed",ylim=[20,80]),
        mpf.make_addplot(all['buf3'], color='b', panel=1, ylim=[20,80]),
        mpf.make_addplot(all['buf4'], color='r', panel=1, ylim=[20,80]),
        mpf.make_addplot(all['buf5'], color='b', panel=1, ylim=[20,80],type='scatter', marker='^', markersize=100),
        mpf.make_addplot(all['buf6'], color='r', panel=1, ylim=[20,80],type='scatter', marker='^', markersize=100),
        ]

    mpf.plot(all, title='eurusd_daily.csv', figsize=(10,10),type='candle', mav=(5, 25), addplot=add_plot, volume_panel=1, savefig='eurusd_daily.png')
