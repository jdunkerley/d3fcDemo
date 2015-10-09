(function() {
  'use strict';

  angular.module('d3Test.quandlServices')
    .controller('quandlCtrl', ['quandl', '$window', function(quandl, $window) {
      var _this = this;

      _this.statusMessage = 'Ready ...';
      _this.state = 'alert-info';

      // Quandl Data Connection
      _this.database = $window.localStorage.getItem('quandl_database') || 'YAHOO';
      _this.dataSet = $window.localStorage.getItem('quandl_dataSet') || 'L_ARM';
      _this.datakeySet = function() {
        $window.localStorage.setItem('quandl_database', _this.database);
        $window.localStorage.setItem('quandl_dataSet', _this.dataSet);

        _this.statusMessage = 'Fetching Data ...';
        _this.state = 'alert-warning';

        var database = _this.database;
        var dataset = _this.dataSet;
        quandl.getData(database, dataset)
          .then(function(result) {
            if (database !== _this.database || dataset !== _this.dataSet) {
              return;
            }

            if (result.error) {
              _this.data = [];
              _this.statusMessage = 'Failed to get data for ' + database + '/' + dataSet + ' : ' + result.error;
              _this.state = 'alert-warning';
              return;
            }

            _this.data = result.map(function(d) {
              var scale = d['adjusted Close'] / d.close;

              var output = {};
              for (var key in d) {
                switch(key) {
                  case 'date':
                    output.date = d.date;
                    break;
                  case 'adjusted Close':
                    break;
                  default:
                    output[key] = d[key] * scale;
                }
              }

              return output;
            });

            _this.statusMessage = 'Ready ...';
            _this.state = 'alert-success';
          });
      };

      // Read Api Key from Local Storage
      quandl.apiKey($window.localStorage.getItem('quandl_ApiKey'));
      _this.apiKey = quandl.apiKey();
      _this.apiKeySet = function() {
        quandl.apiKey(_this.apiKey);
        $window.localStorage.setItem('quandl_ApiKey', _this.apiKey);
      };

      _this.datakeySet();
    }]);
})();