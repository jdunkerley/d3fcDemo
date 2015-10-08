(function() {
  'use strict';

  angular.module('d3Test.quandlServices')
    .service('quandl', ['$q', function($q) {
      var _this = this;

      var quandlD3 = fc.data.feed.quandl();

      this.apiKey = quandlD3.apiKey;

      this.getData = function(databaseCode, dataSetCode) {
        var defer = $q.defer();

        quandlD3
          .database(databaseCode)
          .dataset(dataSetCode);

        quandlD3(function(error, data) {
          if (error) {
            defer.reject(error);
          } else {
            defer.resolve(data);
          }
        });

        return defer.promise;
      }
    }]);
})();