window.onload = function () {
  iOffset = 0;
  length = 30;
  refreshChart(iOffset,length);

  $("#spinner").spinner({
    min: 0,
    spin: function (event, ui) {
      var iOffset = $("#spinner").spinner("value");
      refreshChart(iOffset,length);
    }
  })
}

function refreshChart(offset,length){
  $.get("weekly.AAPL.txt", function (data) {
    rawData = convertYahooFinanceCsvToCandles(data, offset,length);//csvデータを変換する;
    DrawChart(rawData, offset);
  }).fail(function () { alert('Ticker not found.'); });
}

function DrawChart(data, offset) {
  var chart = new CanvasJS.Chart("chartContainer", {
    animationEnabled: true,
    exportEnabled: true,
    exportFileName: "Tesla-StockChart",
    title: {
      text: "Tesla Stock Price - 2016"
    },
    axisX: {
      interval: 1,
      intervalType: "month",
      valueFormatString: "MMM"
    },
    axisY: {
      includeZero: false,
      prefix: "$",
      title: "Price (in USD)"
    },
    data: [{
      type: "candlestick",
      yValueFormatString: "$###0.00",
      xValueFormatString: "MMM YYYY",
      dataPoints: data
    }]
  });
  chart.render();
};
