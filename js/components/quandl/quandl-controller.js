(function () {
    'use strict';

    angular.module('d3Test.quandlServices')
        .controller('quandlCtrl', ['quandl', '$window', function (quandl, $window) {
            var self = this;

            self.statusMessage = 'Ready ...';
            self.state = 'alert-info';

            // Quandl Data Connection
            self.database = $window.localStorage.getItem('quandl_database') || 'YAHOO';
            self.dataSet = $window.localStorage.getItem('quandl_dataSet') || 'L_ARM';
            self.datakeySet = function () {
                $window.localStorage.setItem('quandl_database', self.database);
                $window.localStorage.setItem('quandl_dataSet', self.dataSet);

                self.statusMessage = 'Fetching Data ...';
                self.state = 'alert-warning';

                var database = self.database;
                var dataset = self.dataSet;
                quandl.getData(database, dataset)
                    .then(function (result) {
                        if (database !== self.database || dataset !== self.dataSet) {
                            return;
                        }

                        if (result.error) {
                            self.data = [];
                            self.statusMessage = 'Failed to get data for ' + database + '/' + dataSet + ' : ' + result.error;
                            self.state = 'alert-warning';
                            return;
                        }

                        self.data = result.map(function (d) {
                            var scale = d['adjusted Close'] / d.close;

                            var output = {};
                            for (var key in d) {
                                switch (key) {
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

                        self.statusMessage = 'Ready ...';
                        self.state = 'alert-success';
                    });
            };

            // Read Api Key from Local Storage
            quandl.apiKey($window.localStorage.getItem('quandl_ApiKey'));
            self.apiKey = quandl.apiKey();
            self.apiKeySet = function () {
                quandl.apiKey(self.apiKey);
                $window.localStorage.setItem('quandl_ApiKey', self.apiKey);
            };

            self.datakeySet();
        }]);
} ());