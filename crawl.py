import pandas as pd
import pdb
import os
import re
import requests
import io
from alpha_vantage.timeseries import TimeSeries

api_key = 'KDDTQTNE9OTMD4V4.'
symbol = "eurusd"
time_window = 'daily'

def main():
    ts = TimeSeries(key=api_key, output_format='pandas')
    data, meta_data = ts.get_daily(symbol, outputsize='full')
    data.sort_values('date',inplace=True,ascending=False)
    data.to_csv(f'data/{symbol}_{time_window}.csv')

if __name__ == '__main__':
    main()
