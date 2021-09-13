import pandas as pd
import pdb
import os
import re
import requests
import io
from alpha_vantage.timeseries import TimeSeries
from time import sleep
from pandas_datareader import data

api_key = 'KDDTQTNE9OTMD4V4.'
symbols = ['EURUSD']


time_window = 'daily'

def main():
    ts = TimeSeries(key=api_key, output_format='pandas')
    for symbol in symbols:
            try:
                data, meta_data = ts.get_daily(symbol.lower(), outputsize='full')
                data.sort_values('date',inplace=True,ascending=False)
                fn = f'{symbol.lower()}_{time_window}.csv'
                data.to_csv(f'data/{fn}')
                print(f"<option value='{fn}'>{fn}</option>")
            except:
                print(symbol+" err")
                pass

def pandd(symbol):
    time_window = 'daily' 
    jpy = data.DataReader(symbol ,'fred')
    jpy.sort_values('DATE',inplace=True,ascending=False)
    jpy = jpy.dropna()
    fn = f'{symbol.lower()}_{time_window}.csv'
    jpy.to_csv(f'data/{fn}')
    print(f"<option value='{fn}'>{fn}</option>") 

def pan4h(symbol):
    cwd = os.getcwd()
    fn = os.path.join(cwd,"data", symbol + '.csv')
    print(fn)
    df = pd.read_csv(fn,header=None)
    df = df.sort_values([0,1],ascending=[False,False])
    del df[1]
    df.to_csv(fn,index = False)

if __name__ == '__main__':
    main()
    pandd('DEXJPUS')
    pandd("GOLDAMGBD228NLBM")
    pandd("NIKKEI225")
    pan4h('EURUSD-a240')
    pan4h('EURUSD-a60')
