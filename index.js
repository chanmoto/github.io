// each indicator needs to have a unique name in the indicators object
// the value is an array of the parameters used to define the indicaotr
$(function () {
  $('#ticker').focus();
  var ticker1 = $('#ticker').val()
  $("#spinner").spinner({
    min: 0,
    spin: function (event, ui) {
      var iOffset = $("#spinner").spinner("value");
      refreshChart('#ticker', iOffset);
    }
  });
  refreshChart('#ticker', 0);
  $('#ticker').change(function () {
       refreshChart('#ticker');
  });
  $('#ticker').click(function () {
    $('#ticker').select();
  });
  $('.history').on('click', 'li', function () {
    $('#ticker').val($(this).text());
    $("#spinner").spinner("value", 0);
    refreshChart('#ticker');
  });
});
var refreshChart = function (selector, offset) {
  var ticker1 = $(selector).val()

  var options = {
    title: ticker1 + ' dairy'
    , offset: offset
    , indicators: [
      ['EMA', 'c', 26]
      , ['SMA', 'c', 40]
      , ['RSI', 'c', 20, 20, 2, 3, 0.001]
      , ['RSI', 'c', 25, 25, 2, 2, 0.001]
      , ['RSI', 'c', 30, 30, 2, 1, 0.001]
    ]
  };

$.get("../../data/"+ ticker1, function (data) {
  $('.history').html(addHistory(ticker));
  var chart = new Candlestick("myChart", data, options);
  window.Candlestick.chart = chart;
  eval($('#code').val());
}).fail(function () { alert('Ticker not found.'); });
  //$(selector).select();//conflicts with spinner
}
var addHistory = function (ticker) {
  if (typeof addHistory.tickers == 'undefined') {
    addHistory.tickers = [ticker];
  } else if (addHistory.tickers.indexOf(ticker) == -1) {
    addHistory.tickers.push(ticker);
  }
  return '<ul><li>' + addHistory.tickers.join('</li><li>') + '</li></ul>';
}
