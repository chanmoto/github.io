import pandas as pd
import pdb
import os
import re
import requests
import io
from alpha_vantage.timeseries import TimeSeries
from time import sleep

api_key = 'KDDTQTNE9OTMD4V4.'
symbols = ['RGLDOU.SWI','EURUSD','GBPJPY','GBPUSD','NZDJPY','USDCAD','USDJPY','EURGBP','EURJPY','GBPAUD']

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

if __name__ == '__main__':
    main()
